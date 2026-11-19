import { test, expect } from '@playwright/test';

// The tests below CREATE and DELETE disposable user-generated data.
// Never allow them to run on a real Daloy instance or on a custom staging URL.
const STAGING_URL = 'https://daloy-render-preview.onrender.com';
const permitted = process.env.E2E_ENABLE_DISPOSABLE_STAGING_SIGNUP === 'true'
  && (process.env.E2E_BASE_URL || '').replace(/\/$/, '') === STAGING_URL;

function unique(suffix) {
  return 'e2e_' + suffix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function registerDisposable(page, prefix = 'voyager') {
  const username = unique(prefix);
  const account = {
    name: 'Daloy E2E ' + prefix,
    username,
    email: username + '@example.test',
    password: 'DaloyStageOnly!2026',
  };
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.locator('#name').fill(account.name);
  await page.locator('#username').fill(account.username);
  await page.locator('#email').fill(account.email);
  await page.locator('#password').fill(account.password);
  await page.locator('#password_confirmation').fill(account.password);
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/register' && r.request().method() === 'POST'),
    page.getByRole('button', { name: /create account/i }).click(),
  ]);
  expect(response.status(), 'POST /register should redirect without server errors').toBe(302);
  await expect(page).toHaveURL(/\/(app|home)(\?|$)/);
  const props = await readProps(page, '/app');
  const id = props.auth?.user?.id;
  expect(id, 'New account id in Inertia page props').toBeTruthy();
  return { ...account, id };
}

async function readProps(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  const json = await page.locator('#app').getAttribute('data-page');
  expect(json, 'Inertia data-page was missing for ' + path).toBeTruthy();
  return JSON.parse(json).props;
}

function findPost(props, content) {
  return props.posts?.data?.find(p => p.content === content);
}

async function openComposer(page) {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.locator('.daloy-composer button').first().click();
  await expect(page.getByPlaceholder("What's flowing through your mind?")).toBeVisible();
}

async function submitPost(page, content) {
  await page.getByPlaceholder("What's flowing through your mind?").fill(content);
  const [postResponse] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/posts' && r.request().method() === 'POST', { timeout: 40_000 }),
    page.getByRole('button', { name: 'Post', exact: true }).click(),
  ]);
  expect(postResponse.status(), 'POST /posts should redirect').toBe(302);
  await expect(page.locator('.daloy-post-card').filter({ hasText: content })).toBeVisible({ timeout: 25_000 });
  const props = await readProps(page, '/app');
  const post = findPost(props, content);
  expect(post, 'New post missing from author feed after refresh').toBeTruthy();
  return post;
}

async function axiosCall(page, method, url, data) {
  return page.evaluate(async ({ method, url, data }) => {
    try {
      const result = await window.axios({ method, url, data, headers: { Accept: 'application/json' } });
      return {
        status: result.status,
        data: typeof result.data === 'object' ? result.data : null,
        redirected: result.request?.responseURL || null,
      };
    } catch (e) {
      return { status: e.response?.status || 0, data: e.response?.data || null, error: String(e.message) };
    }
  }, { method, url, data });
}

function observeServerFailures(page) {
  const failures = [];
  page.on('response', r => {
    if (r.status() >= 500 && r.url().startsWith(STAGING_URL)) {
      failures.push(r.status() + ' ' + r.request().method() + ' ' + new URL(r.url()).pathname);
    }
  });
  return failures;
}

test('user journey: register → create post → like → comment → edit → save → delete', async ({ page }, info) => {
  test.skip(!permitted, 'This test writes data and requires the isolated Render preview URL');
  test.skip(!['mobile-390', 'desktop-1440'].includes(info.project.name), 'Phone and desktop coverage');
  test.setTimeout(240_000);
  const failures = observeServerFailures(page);
  const account = await registerDisposable(page, 'post');
  const original = unique('post_text') + ' A real text post from Playwright.';
  await openComposer(page);
  const post = await submitPost(page, original);
  expect(post.user_id).toBe(account.id);
  const card = page.locator('.daloy-post-card[data-post-id="' + post.id + '"]');
  await expect(card).toContainText(original);

  const [likeResponse] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/posts/' + post.id + '/like') && r.request().method() === 'POST'),
    card.locator('button').filter({ hasText: /^Like$/ }).click(),
  ]);
  expect(likeResponse.status(), 'Like should work').toBe(200);
  const likeData = await likeResponse.json();
  expect(likeData.reacted).toBe(true);

  await card.locator('button').filter({ hasText: /^Comment$/ }).click();
  const commentText = unique('comment') + ' Hello from the staging test.';
  await card.getByPlaceholder('Write a comment...').fill(commentText);
  const [commentResponse] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/posts/' + post.id + '/comments') && r.request().method() === 'POST'),
    card.locator('form button[type="submit"]').click(),
  ]);
  expect(commentResponse.status(), 'Comment should be created').toBe(201);
  await expect(card.getByText(commentText)).toBeVisible();
  const allComments = await axiosCall(page, 'get', '/posts/' + post.id + '/comments');
  expect(allComments.status).toBe(200);
  expect(allComments.data?.data?.some(x => x.content === commentText)).toBe(true);

  await card.getByRole('button', { name: 'Post options' }).click();
  await card.getByRole('button', { name: 'Edit Post' }).click();
  const edited = original + ' Edited and saved.';
  await card.locator('textarea').fill(edited);
  const [editResponse] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/posts/' + post.id) && r.request().method() === 'PUT'),
    card.getByRole('button', { name: 'Save', exact: true }).click(),
  ]);
  expect([302, 303], 'Inertia redirect after PUT').toContain(editResponse.status());
  await expect(card).toContainText(edited);

  await card.getByRole('button', { name: 'Post options' }).click();
  const [bookmarkResponse] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/posts/' + post.id + '/bookmark') && r.request().method() === 'POST'),
    card.getByRole('button', { name: 'Save post' }).click(),
  ]);
  expect(bookmarkResponse.status(), 'Save post menu action failed').toBe(200);
  expect((await bookmarkResponse.json()).bookmarked).toBe(true);
  const saved = await readProps(page, '/saved');
  expect(saved, 'Saved posts screen should load').toBeTruthy();
  await expect(page.getByText(edited)).toBeVisible();

  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  const own = page.locator('.daloy-post-card[data-post-id="' + post.id + '"]');
  await own.getByRole('button', { name: 'Post options' }).click();
  await own.getByRole('button', { name: 'Delete Post' }).click();
  await expect(page.getByRole('heading', { name: 'Delete this post?' })).toBeVisible();
  const [deleteResponse] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/posts/' + post.id) && r.request().method() === 'DELETE'),
    page.getByRole('button', { name: 'Delete', exact: true }).click(),
  ]);
  expect([302, 303], 'Inertia redirect after DELETE').toContain(deleteResponse.status());
  const refreshed = await readProps(page, '/app');
  expect(findPost(refreshed, edited), 'Deleted post should not reappear in feed').toBeFalsy();
  expect(failures, 'Unexpected Laravel HTTP 5xx requests').toEqual([]);
});

test('post media: upload a real PNG and fetch its stored public URL', async ({ page }, info) => {
  test.skip(!permitted, 'This test writes data and requires the isolated Render preview URL');
  test.skip(info.project.name !== 'desktop-1440', 'One image upload is sufficient');
  test.setTimeout(180_000);
  const failures = observeServerFailures(page);
  await registerDisposable(page, 'media');
  const content = unique('media_text') + ' Image upload validation.';
  await openComposer(page);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Gh8AAAAASUVORK5CYII=', 'base64');
  await page.getByTestId('post-media-input').setInputFiles({ name: 'staging-only.png', mimeType: 'image/png', buffer: png });
  const post = await submitPost(page, content);
  expect(post.media?.length, 'Stored media record missing').toBeGreaterThan(0);
  const mediaURL = post.media[0].url;
  expect(mediaURL, 'Stored media file URL missing').toMatch(/^\/storage\//);
  const fetched = await page.request.get(mediaURL);
  expect(fetched.status(), 'Uploaded image returned 404: public storage symlink may be missing').toBe(200);
  expect(fetched.headers()['content-type'] || '').toMatch(/image\/png|image\//);
  expect(failures, 'Unexpected Laravel HTTP 5xx requests').toEqual([]);
});

test('two users: polls, saved permissions, school membership and direct messaging', async ({ browser, page }, info) => {
  test.skip(!permitted, 'This test writes data and requires the isolated Render preview URL');
  test.skip(info.project.name !== 'desktop-1440', 'Cross-user integration runs on desktop');
  test.setTimeout(240_000);
  const failures = observeServerFailures(page);
  const alice = await registerDisposable(page, 'alice');
  const otherContext = await browser.newContext({ baseURL: STAGING_URL });
  try {
    const bobPage = await otherContext.newPage();
    const bobFailures = observeServerFailures(bobPage);
    const bob = await registerDisposable(bobPage, 'bob');

    const pollText = unique('poll_post') + ' Which activity is your favorite?';
    await openComposer(page);
    await page.getByRole('button', { name: 'Add poll' }).click();
    await page.getByPlaceholder('Ask a question...').fill('Pick one for the staging-only test');
    const pollPost = await submitPost(page, pollText);
    expect(pollPost.poll?.options?.length, 'Poll options were not stored').toBe(2);
    const optionId = pollPost.poll.options[0].id;
    const vote = await axiosCall(page, 'post', '/polls/' + pollPost.poll.id + '/vote', { option_id: optionId });
    expect(vote.status, 'Poll vote failed').toBe(200);

    // The other account must see a public post, but must not edit/delete it.
    const visibleToBob = await readProps(bobPage, '/app');
    expect(findPost(visibleToBob, pollText), 'Public post was missing from a different user feed').toBeTruthy();
    const forbiddenEdit = await axiosCall(bobPage, 'put', '/posts/' + pollPost.id, { content: 'FORBIDDEN E2E', visibility: 'public' });
    expect(forbiddenEdit.status, 'Other users should not edit a post').toBe(403);
    const forbiddenDelete = await axiosCall(bobPage, 'delete', '/posts/' + pollPost.id);
    expect(forbiddenDelete.status, 'Other users should not delete a post').toBe(403);

    // The visible Report Post menu must open a real moderation dialog and save a report.
    await bobPage.goto('/app', { waitUntil: 'domcontentloaded' });
    const reportedPost = bobPage.locator('.daloy-post-card[data-post-id="' + pollPost.id + '"]');
    await expect(reportedPost).toBeVisible();
    await reportedPost.getByRole('button', { name: 'Post options' }).click();
    await reportedPost.getByRole('button', { name: 'Report Post' }).click();
    const reportDialog = bobPage.getByRole('dialog', { name: 'Report post' });
    await expect(reportDialog).toBeVisible();
    await reportDialog.getByLabel('Reason').selectOption('spam');
    await reportDialog.getByPlaceholder('Describe the problem...').fill('Automated staging-only report, no real users affected.');
    const [reportResponse] = await Promise.all([
      bobPage.waitForResponse(r => r.url().includes('/posts/' + pollPost.id + '/report') && r.request().method() === 'POST'),
      reportDialog.getByRole('button', { name: 'Submit report' }).click(),
    ]);
    expect(reportResponse.status(), 'Report post endpoint must create a moderation item').toBe(201);
    await expect(reportDialog.getByRole('status')).toContainText('Report submitted');
    await reportDialog.getByRole('button', { name: 'Done' }).click();

    const duplicate = await axiosCall(bobPage, 'post', '/posts/' + pollPost.id + '/report', { reason: 'spam' });
    expect(duplicate.status, 'Duplicate pending report must be blocked').toBe(422);

    // Direct messages must persist and be retrievable by the recipient.
    const direct = await axiosCall(page, 'post', '/api/conversations/start', { user_id: bob.id });
    expect(direct.status, 'Could not start conversation').toBe(200);
    const conversationId = direct.data?.id;
    expect(conversationId).toBeTruthy();
    const messageText = unique('message') + ' Hello from Alice.';
    const sent = await axiosCall(page, 'post', '/api/conversations/send', { conversation_id: conversationId, content: messageText });
    expect(sent.status, 'Could not send a direct message').toBe(200);
    const received = await axiosCall(bobPage, 'get', '/api/conversations/' + conversationId + '/messages');
    expect(received.status, 'Recipient could not fetch the message').toBe(200);
    expect(received.data?.data?.some(m => m.content === messageText), 'Message did not persist').toBe(true);

    // A disposable user can make a public school; the second user can join.
    const schoolName = unique('school');
    const created = await axiosCall(page, 'post', '/schools', { name: schoolName, description: 'Temporary staging school', privacy: 'public' });
    expect(created.status, 'School creation failed').toBe(200);
    const schoolProps = await readProps(page, '/schools');
    const list = schoolProps.schools?.data || schoolProps.schools || [];
    const school = Array.isArray(list) ? list.find(s => s.name === schoolName) : null;
    expect(school, 'New school not listed').toBeTruthy();
    const joined = await axiosCall(bobPage, 'post', '/schools/' + school.id + '/toggle-membership');
    expect(joined.status, 'School join failed').toBe(200);
    expect(joined.data?.is_member).toBe(true);

    // Profile route should display the actual user. Write and read profile settings.
    const updatedName = alice.name + ' Updated';
    const profileUpdate = await axiosCall(page, 'post', '/settings/profile', {
      _method: 'PATCH', name: updatedName, username: alice.username, email: alice.email, bio: 'Test account biography.',
    });
    expect(profileUpdate.status, 'Profile update failed').toBe(200);
    const settings = await readProps(page, '/settings');
    expect(settings.user?.name).toBe(updatedName);
    const profilePage = await bobPage.goto('/users/' + alice.id, { waitUntil: 'domcontentloaded' });
    expect(profilePage?.status()).toBe(200);
    await expect(bobPage.getByText(updatedName).first()).toBeVisible();

    expect(failures, 'Unexpected Laravel HTTP 5xx for Alice').toEqual([]);
    expect(bobFailures, 'Unexpected Laravel HTTP 5xx for Bob').toEqual([]);
  } finally {
    await otherContext.close();
  }
});
