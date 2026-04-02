<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExploreCollection extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'description', 'icon', 'hashtag_ids', 'display_order', 'is_active'];

    protected function casts(): array
    {
        return [
            'hashtag_ids' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function hashtags()
    {
        return Hashtag::whereIn('id', $this->hashtag_ids ?? []);
    }
}
