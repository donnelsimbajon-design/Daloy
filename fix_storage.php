<?php
$files = glob('c:/xampp/htdocs/daloy2.0/app/Http/Controllers/*.php');
foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // Make sure we include the Storage facade if it's missing (only if we actually use Storage::url)
    $needsStorage = false;

    // 1. Remove the forced 'public' disk from store() calls
    // E.g. ->store('profile-pictures', 'public') becomes ->store('profile-pictures')
    $content = preg_replace('/->store\(([^,]+),\s*\'public\'\)/', '->store($1)', $content);

    // 2. Replace hardcoded '/storage/' string concatenation with Storage::url()
    if (strpos($content, "'/storage/' . \$path") !== false) {
        $content = str_replace("'/storage/' . \$path", 'Storage::url($path)', $content);
        $needsStorage = true;
    }
    if (strpos($content, "'/storage/' . \$request->file") !== false) {
        // Special case in MessagingController: '/storage/' . $request->file('file')->store('message_attachments', 'public')
        $content = preg_replace("/'\/storage\/'\s*\.\s*(.+?->store\('message_attachments'\))/", 'Storage::url($1)', $content);
        $needsStorage = true;
    }

    // 3. Remove str_replace('/storage/', '', $path) used for deleting old paths
    // Because Storage::delete expects the raw path, but we now have full URLs
    // Wait, if it's a Cloudinary URL, Storage::delete() might need just the path (or the Cloudinary driver handles it).
    // The Cloudinary driver expects the public_id, which can be extracted, or it can handle the full URL!
    // We will just remove the '/storage/' stripping.
    $content = preg_replace('/str_replace\(\'\/storage\/\',\s*\'\',\s*(.+?)\)/', '$1', $content);

    // Add use Illuminate\Support\Facades\Storage; if not present
    if ($needsStorage && strpos($content, 'use Illuminate\Support\Facades\Storage;') === false) {
        $content = preg_replace('/namespace App\\\Http\\\Controllers;/', "namespace App\Http\Controllers;\n\nuse Illuminate\Support\Facades\Storage;", $content);
    }
    
    file_put_contents($file, $content);
    echo "Processed $file\n";
}
