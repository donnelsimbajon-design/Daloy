# Daloy 2.0 - Component Reorganization Script
# Creates new folder structure and copies all files to new locations.
# Safe to run multiple times. Does NOT delete old files.

$base = "c:\xampp\htdocs\daloy2.0\resources\js\Components"

Write-Host "Creating new folder structure..." -ForegroundColor Cyan

$folders = @(
    "$base\UI\Cards",
    "$base\UI\Buttons",
    "$base\UI\Panels",
    "$base\UI\Navigation",
    "$base\UI\Modals",
    "$base\UI\Badges",
    "$base\UI\Misc",
    "$base\Features\Posts",
    "$base\Features\Comments",
    "$base\Features\Stories",
    "$base\Features\Messaging",
    "$base\Features\Social",
    "$base\Features\Notifications",
    "$base\Admin\UI",
    "$base\Admin\Features"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  Created: $($folder.Replace($base, 'Components'))" -ForegroundColor Green
}

Write-Host ""
Write-Host "Copying UI components..." -ForegroundColor Cyan

# UI/Cards
Copy-Item "$base\PostCard.jsx"          "$base\UI\Cards\PostCard.jsx"          -Force
Copy-Item "$base\UserCard.jsx"          "$base\UI\Cards\UserCard.jsx"          -Force

# UI/Buttons
Copy-Item "$base\FollowButton.jsx"          "$base\UI\Buttons\FollowButton.jsx"          -Force
Copy-Item "$base\FriendRequestButton.jsx"   "$base\UI\Buttons\FriendRequestButton.jsx"  -Force
Copy-Item "$base\FloatingActionButton.jsx"  "$base\UI\Buttons\FloatingActionButton.jsx" -Force

# UI/Panels
Copy-Item "$base\ReefPanel.jsx"           "$base\UI\Panels\ReefPanel.jsx"           -Force
Copy-Item "$base\NotificationPanel.jsx"   "$base\UI\Panels\NotificationPanel.jsx"   -Force
Copy-Item "$base\MessagePanel.jsx"        "$base\UI\Panels\MessagePanel.jsx"        -Force

# UI/Navigation
Copy-Item "$base\TopNav.jsx"           "$base\UI\Navigation\TopNav.jsx"           -Force
Copy-Item "$base\NavDrawer.jsx"        "$base\UI\Navigation\NavDrawer.jsx"        -Force
Copy-Item "$base\LanguageSelector.jsx" "$base\UI\Navigation\LanguageSelector.jsx" -Force

# UI/Modals
Copy-Item "$base\CreatePostModal.jsx" "$base\UI\Modals\CreatePostModal.jsx" -Force
Copy-Item "$base\ShareModal.jsx"      "$base\UI\Modals\ShareModal.jsx"      -Force

# UI/Badges
Copy-Item "$base\StatusBar.jsx" "$base\UI\Badges\StatusBar.jsx" -Force

# UI/Misc
Copy-Item "$base\Feed.jsx" "$base\UI\Misc\Feed.jsx" -Force

Write-Host ""
Write-Host "Copying Feature components..." -ForegroundColor Cyan

# Features/Posts
Copy-Item "$base\PostActions.jsx"      "$base\Features\Posts\PostActions.jsx"      -Force
Copy-Item "$base\CreatePostModal.jsx"  "$base\Features\Posts\CreatePostModal.jsx"  -Force

# Features/Comments
Copy-Item "$base\Comments\CommentsSection.jsx" "$base\Features\Comments\CommentsSection.jsx" -Force
Copy-Item "$base\Comments\CommentItem.jsx"     "$base\Features\Comments\CommentItem.jsx"     -Force

# Features/Stories
Copy-Item "$base\StoryRail.jsx" "$base\Features\Stories\StoryRail.jsx" -Force

# Features/Messaging
Copy-Item "$base\MessagePanel.jsx" "$base\Features\Messaging\MessagePanel.jsx" -Force
Copy-Item "$base\ShareModal.jsx"   "$base\Features\Messaging\ShareModal.jsx"   -Force

# Features/Social
Copy-Item "$base\FriendRequestButton.jsx" "$base\Features\Social\FriendRequestButton.jsx" -Force
Copy-Item "$base\FollowButton.jsx"        "$base\Features\Social\FollowButton.jsx"        -Force
Copy-Item "$base\DiscoveryReef.jsx"       "$base\Features\Social\DiscoveryReef.jsx"       -Force

# Features/Notifications
Copy-Item "$base\NotificationPanel.jsx" "$base\Features\Notifications\NotificationPanel.jsx" -Force

Write-Host ""
Write-Host "Copying Admin components..." -ForegroundColor Cyan

# Admin/UI
Copy-Item "$base\Admin\Sidebar.jsx"     "$base\Admin\UI\Sidebar.jsx"     -Force
Copy-Item "$base\Admin\Topbar.jsx"      "$base\Admin\UI\Topbar.jsx"      -Force
Copy-Item "$base\Admin\StatCard.jsx"    "$base\Admin\UI\StatCard.jsx"    -Force
Copy-Item "$base\Admin\StatusBadge.jsx" "$base\Admin\UI\StatusBadge.jsx" -Force
Copy-Item "$base\Admin\Modal.jsx"       "$base\Admin\UI\Modal.jsx"       -Force

# Admin/Features
Copy-Item "$base\Admin\DataTable.jsx" "$base\Admin\Features\DataTable.jsx" -Force
Copy-Item "$base\Admin\BarChart.jsx"  "$base\Admin\Features\BarChart.jsx"  -Force

Write-Host ""
Write-Host "Verifying new files exist..." -ForegroundColor Cyan

$newFiles = @(
    "$base\UI\Cards\PostCard.jsx",
    "$base\UI\Cards\UserCard.jsx",
    "$base\UI\Buttons\FollowButton.jsx",
    "$base\UI\Buttons\FriendRequestButton.jsx",
    "$base\UI\Buttons\FloatingActionButton.jsx",
    "$base\UI\Panels\ReefPanel.jsx",
    "$base\UI\Panels\NotificationPanel.jsx",
    "$base\UI\Panels\MessagePanel.jsx",
    "$base\UI\Navigation\TopNav.jsx",
    "$base\UI\Navigation\NavDrawer.jsx",
    "$base\UI\Navigation\LanguageSelector.jsx",
    "$base\UI\Modals\CreatePostModal.jsx",
    "$base\UI\Modals\ShareModal.jsx",
    "$base\UI\Badges\StatusBar.jsx",
    "$base\UI\Misc\Feed.jsx",
    "$base\Features\Posts\PostActions.jsx",
    "$base\Features\Posts\CreatePostModal.jsx",
    "$base\Features\Comments\CommentsSection.jsx",
    "$base\Features\Comments\CommentItem.jsx",
    "$base\Features\Stories\StoryRail.jsx",
    "$base\Features\Messaging\MessagePanel.jsx",
    "$base\Features\Messaging\ShareModal.jsx",
    "$base\Features\Social\FriendRequestButton.jsx",
    "$base\Features\Social\FollowButton.jsx",
    "$base\Features\Social\DiscoveryReef.jsx",
    "$base\Features\Notifications\NotificationPanel.jsx",
    "$base\Admin\UI\Sidebar.jsx",
    "$base\Admin\UI\Topbar.jsx",
    "$base\Admin\UI\StatCard.jsx",
    "$base\Admin\UI\StatusBadge.jsx",
    "$base\Admin\UI\Modal.jsx",
    "$base\Admin\Features\DataTable.jsx",
    "$base\Admin\Features\BarChart.jsx"
)

$allGood = $true
foreach ($f in $newFiles) {
    if (Test-Path $f) {
        Write-Host "  OK: $($f.Replace($base + '\', ''))" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $($f.Replace($base + '\', ''))" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host ""
    Write-Host "All files copied successfully! Ready for import path updates." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some files are missing. Check errors above." -ForegroundColor Yellow
}
