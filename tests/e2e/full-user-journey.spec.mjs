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
  // A delayed welcome overlay must never interrupt a new student's first post.
  await page.waitForTimeout(3250);
  await expect(page.getByRole('heading', { name: /^Welcome,/ })).toHaveCount(0);
  await openComposer(page);
  await expect(page.getByRole('dialog', { name: 'Create post' })).toBeVisible();
  await page.getByRole('button', { name: 'Add location' }).click();
  await expect(page.getByRole('textbox', { name: 'Location (optional)' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove location' }).click();
  await expect(page.getByRole('textbox', { name: 'Location (optional)' })).toHaveCount(0);
  const post = await submitPost(page, original);
  expect(post.user_id).toBe(account.id);
  const card = page.locator('.daloy-post-card[data-post-id="' + post.id + '"]');
  await expect(card).toContainText(original);

  // Share dialog must support accessible monochrome options.
  await card.getByRole('button', { name: 'Share', exact: true }).click();
  const shareDialog = page.getByRole('dialog', { name: 'Share post' });
  await expect(shareDialog).toBeVisible();
  await expect(shareDialog.getByRole('button', { name: 'Copy Link' })).toBeVisible();
  await shareDialog.getByRole('button', { name: 'QR Code' }).click();
  await expect(shareDialog.getByLabel('Post QR code')).toBeVisible();
  await shareDialog.getByRole('button', { name: 'Back to sharing' }).click();
  await shareDialog.getByRole('button', { name: 'Message' }).click();
  await expect(shareDialog.getByLabel('Find a classmate')).toBeVisible();
  await shareDialog.getByRole('button', { name: 'Close share dialog' }).click();
  await expect(shareDialog).toHaveCount(0);

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

  // Clicking a photo must open a true-black, keyboard-dismissible viewer.
  await page.locator('.daloy-post-card[data-post-id="' + post.id + '"]')
    .getByRole('button', { name: 'View photo 1' }).click();
  const viewer = page.getByRole('dialog', { name: 'Post photo viewer' });
  await expect(viewer).toBeVisible();
  await expect(viewer).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);

  // A missing or expired file should present a readable fallback rather than
  // a broken image icon. Intercept only this disposable test post's image.
  await page.route('**/storage/posts/' + post.id + '/**', route =>
    route.fulfill({ status: 403, contentType: 'text/plain', body: 'Unavailable' })
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  const unavailableCard = page.locator('.daloy-post-card[data-post-id="' + post.id + '"]');
  await expect(unavailableCard.getByTestId('media-unavailable')).toContainText('Photo unavailable');
  await page.unroute('**/storage/posts/' + post.id + '/**');

  // Drive the same Inertia delete flow the user sees instead of Axios
  // (a raw Axios DELETE follows Laravel's redirect differently).
  const card = page.locator('.daloy-post-card[data-post-id="' + post.id + '"]');
  await card.getByRole('button', { name: 'Post options' }).click();
  await card.getByRole('button', { name: 'Delete Post' }).click();
  const [deleteResponse] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/posts/' + post.id) && r.request().method() === 'DELETE'),
    page.getByRole('button', { name: 'Delete', exact: true }).click(),
  ]);
  expect([302, 303], 'Deleting the image post should redirect').toContain(deleteResponse.status());
  const afterDelete = await page.request.get(mediaURL);
  expect([403, 404], 'Deleted post image should no longer be accessible').toContain(afterDelete.status());

  expect(failures, 'Unexpected Laravel HTTP 5xx requests').toEqual([]);
});

test('two users: polls, saved permissions, school membership and direct messaging', async ({ browser, page }, info) => {
  test.skip(!permitted, 'This test writes data and requires the isolated Render preview URL');
  test.skip(info.project.name !== 'desktop-1440', 'Cross-user integration runs on desktop');
  test.setTimeout(240_000);
  const failures = observeServerFailures(page);
  const alice = await registerDisposable(page, 'alice');
  const createdPostIds = [];

  // The profile Poll shortcut should open the poll builder directly, not a
  // misleading generic composer. It must also have a keyboard usable Flow selector.
  await page.goto('/users/' + alice.id, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Create poll' }).click();
  const profilePoll = page.getByTestId('poll-builder');
  await expect(profilePoll).toBeVisible();
  await expect(page.getByRole('button', { name: 'Post', exact: true })).toBeDisabled();
  const flowSelector = page.getByRole('button', { name: 'Flow state' });
  await expect(flowSelector).toBeVisible();
  await flowSelector.click();
  await expect(flowSelector).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Close post composer' }).click();

  const otherContext = await browser.newContext({ baseURL: STAGING_URL });
  try {
    const bobPage = await otherContext.newPage();
    const bobFailures = observeServerFailures(bobPage);
    const bob = await registerDisposable(bobPage, 'bob');

    const pollText = unique('poll_post') + ' Which activity is your favorite?';
    await openComposer(page);
    await page.getByRole('button', { name: 'Add poll' }).click();
    const pollBuilder = page.getByTestId('poll-builder');
    await expect(pollBuilder).toBeVisible();
    await page.getByLabel('Poll question').fill('Pick one for the staging-only test');
    await page.getByRole('textbox', { name: 'Option 1' }).fill('Yes');
    await page.getByRole('textbox', { name: 'Option 2' }).fill('No');
    await pollBuilder.getByLabel('Poll duration').selectOption('72');
    await expect(page.getByRole('button', { name: 'Post', exact: true })).toBeEnabled();
    const pollPost = await submitPost(page, pollText);
    createdPostIds.push(pollPost.id);
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

    // Repost a public post and verify the new record appears on the other user's profile.
    const reShared = await axiosCall(bobPage, 'post', '/posts/' + pollPost.id + '/repost');
    expect(reShared.status, 'Repost endpoint should work').toBe(200);
    expect(reShared.data?.reposted).toBe(true);
    const repostId = reShared.data?.repost_id;
    expect(repostId, 'Repost record missing').toBeTruthy();
    const bobProfileProps = await readProps(bobPage, '/users/' + bob.id);
    const bobPosts = bobProfileProps.posts?.data || bobProfileProps.posts || [];
    expect(bobPosts.some(x => x.id === repostId && x.repost_of_id === pollPost.id),
        'Repost must appear on the reposter profile').toBe(true);
    await bobPage.getByRole('button', { name: 'Reposts' }).click();
    const repostCard = bobPage.locator('.daloy-post-card[data-post-id="' + repostId + '"]');
    await expect(repostCard).toBeVisible();
    await expect(repostCard).toContainText(pollText);
    await repostCard.getByRole('button', { name: 'Undo repost' }).click();
    const withoutRepost = await readProps(bobPage, '/users/' + bob.id);
    const remaining = withoutRepost.posts?.data || withoutRepost.posts || [];
    expect(remaining.some(x => x.id === repostId), 'Undo Repost should remove it from the profile').toBe(false);

    // Private posts must not leak via direct URLs, comments, likes or profiles.
    const privateText = unique('private') + ' Visible only to the owner.';
    const privateCreate = await axiosCall(page, 'post', '/posts', {
      content: privateText, visibility: 'private', flow_velocity: 'steady',
    });
    expect(privateCreate.status).toBe(200);
    const ownerPosts = await readProps(page, '/app');
    const privatePost = findPost(ownerPosts, privateText);
    expect(privatePost, 'Owner should still see own private post').toBeTruthy();
    createdPostIds.push(privatePost.id);
    const ownerView = await page.request.get('/posts/' + privatePost.id);
    expect(ownerView.status()).toBe(200);

    const publicUrlGuess = await bobPage.request.get('/posts/' + privatePost.id, { maxRedirects: 0 });
    expect(publicUrlGuess.status(), 'Other user must not read a private post').toBe(404);
    const privateReaction = await axiosCall(bobPage, 'post', '/posts/' + privatePost.id + '/like');
    expect(privateReaction.status, 'Other user must not react to private post').toBe(404);
    const privateComment = await axiosCall(bobPage, 'post', '/posts/' + privatePost.id + '/comments', { content: 'Unauthorised comment' });
    expect(privateComment.status, 'Other user must not comment on private post').toBe(404);
    const privateBookmark = await axiosCall(bobPage, 'post', '/posts/' + privatePost.id + '/bookmark');
    expect(privateBookmark.status, 'Other user must not bookmark private post').toBe(404);
    const privateProfileProps = await readProps(bobPage, '/users/' + alice.id);
    expect(JSON.stringify(privateProfileProps.posts), 'Private post leaked via profile props').not.toContain(privateText);

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
    // Only posts created in this disposable staging test are removed; leave
    // other users' data completely untouched.
    for (const postId of createdPostIds) {
      try { await axiosCall(page, 'delete', '/posts/' + postId); }
      catch (_) { /* disposable preview may reset during a deploy */ }
    }
    await otherContext.close();
  }
});


const TEST_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Gh8AAAAASUVORK5CYII=';

async function submitUpload(page, url, field, extra = {}) {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === url && r.request().method() === 'POST', { timeout: 40_000 }),
    page.evaluate(async ({ url, field, extra, base64 }) => {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const form = new FormData();
      for (const [key, value] of Object.entries(extra)) form.append(key, value);
      form.append(field, new File([bytes], 'playwright-staging-only.png', { type: 'image/png' }));
      try {
        await window.axios.post(url, form, { headers: { Accept: 'application/json' } });
      } catch (error) {
        // Laravel redirects for profile-image updates; the original POST
        // status is independently checked via page.waitForResponse above.
        if (![405].includes(error.response?.status)) throw error;
      }
    }, { url, field, extra, base64: TEST_PNG_BASE64 }),
  ]);
  return response.status();
}

test('stories: text privacy, uploaded photo retrieval and deletion', async ({ page, browser }, info) => {
  test.skip(!permitted, 'Only create stories on the exact isolated Render staging preview');
  test.skip(info.project.name !== 'desktop-1440', 'Cross-user story permissions on desktop');
  test.setTimeout(180_000);
  const fail = observeServerFailures(page);
  await registerDisposable(page, 'stories_owner');
  const bobContext = await browser.newContext({ baseURL: STAGING_URL });
  try {
    const bob = await bobContext.newPage();
    await registerDisposable(bob, 'stories_viewer');
    const secret = unique('secret_story');
    const privateResponse = await axiosCall(page, 'post', '/stories', { type: 'text', visibility: 'private', content: secret });
    expect(privateResponse.status).toBe(200);
    const ownerIndex = await axiosCall(page, 'get', '/stories');
    expect(ownerIndex.status).toBe(200);
    const privateStory = ownerIndex.data?.find(s => s.content === secret);
    expect(privateStory, 'Owner private story missing').toBeTruthy();
    const blockedView = await axiosCall(bob, 'post', '/stories/' + privateStory.id + '/view');
    expect(blockedView.status, 'Private story must not be viewable via direct endpoint').toBe(404);
    const blockedReact = await axiosCall(bob, 'post', '/stories/' + privateStory.id + '/react');
    expect(blockedReact.status, 'Private story must not receive unauthorised reactions').toBe(404);
    const blockedReply = await axiosCall(bob, 'post', '/stories/' + privateStory.id + '/reply', { content: 'Should not be delivered' });
    expect(blockedReply.status, 'Private story must not receive unauthorised replies').toBe(404);

    const mediaContent = unique('photo_story');
    const status = await submitUpload(page, '/stories', 'media', { type: 'photo', visibility: 'public', content: mediaContent });
    expect(status, 'Photo story POST failed').toBe(200);
    const mediaIndex = await axiosCall(page, 'get', '/stories');
    const mediaStory = mediaIndex.data?.find(s => s.content === mediaContent);
    expect(mediaStory?.image, 'Stored story photo missing').toBeTruthy();
    const image = await page.request.get(mediaStory.image);
    expect(image.status(), 'Uploaded story image is not publicly retrievable').toBe(200);
    const removed = await axiosCall(page, 'delete', '/stories/' + mediaStory.id);
    expect(removed.status, 'Deleting story failed').toBe(200);
    expect([403, 404], 'Deleted story photo must be inaccessible').toContain((await page.request.get(mediaStory.image)).status());
    expect(fail).toEqual([]);
  } finally {
    await bobContext.close();
  }
});

test('settings: profile photo uploads and replacement are readable', async ({ page }, info) => {
  test.skip(!permitted, 'Only upload files on the isolated Render staging preview');
  test.skip(info.project.name !== 'desktop-1440', 'Profile image check on desktop');
  test.setTimeout(140_000);
  const fail = observeServerFailures(page);
  await registerDisposable(page, 'avatar');
  const first = await submitUpload(page, '/settings/profile-picture', 'profile_picture');
  expect([302, 303]).toContain(first);
  let data = await readProps(page, '/settings');
  const initial = data.user?.profile_picture;
  expect(initial).toContain('/storage/profile-pictures/');
  expect((await page.request.get(initial)).status(), 'Profile image not accessible').toBe(200);

  const second = await submitUpload(page, '/settings/profile-picture', 'profile_picture');
  expect([302, 303]).toContain(second);
  data = await readProps(page, '/settings');
  const replacement = data.user?.profile_picture;
  expect(replacement).toContain('/storage/profile-pictures/');
  expect(replacement, 'Replacing photo should update URL').not.toBe(initial);
  expect((await page.request.get(replacement)).status(), 'New profile image not accessible').toBe(200);
  expect([403, 404], 'Old profile photo should no longer be publicly accessible').toContain((await page.request.get(initial)).status());
  expect(fail).toEqual([]);
});
