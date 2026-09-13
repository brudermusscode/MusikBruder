<?php

namespace Bruder\Model;

use Illuminate\Support\Collection;
use Bruder\Bruder;
use Bruder\Model\Track;

class Playlist extends Bruder
{

  const string ICON = "stacks";
  const string COLOR = "tertiary";

  /**
   * @var array
   */
  protected $fillable = [
    "name",
    "subtext",
    "deleted_at",
    "updated_at",
  ];

  /**
   * Create a new instance and save it to the database with given parameters.
   *
   * @param object $params
   * @return string
   */
  public function new(object $params)
  {

    // # Unique name validation happens in PlaylistsController.

    /**
     * Name is valid?
     */
    if (strlen(trim($params->name)) < 1)
      return $this->error("<strong>Bruder, ohne Name?</strong>");

    /**
     * Create it!
     */
    $Object = self::create([
      "name" => $params->name,
      "subtext" => $params->subtext,
      "updated_at" => null,
    ]);

    /**
     * @var ?Bookmark
     */
    $LatestBookmark = Bookmark::latest()->first();

    /**
     * Create a Bookmark.
     */
    $Object->bookmark()
      ->create([
        "view_index" => ($LatestBookmark?->view_index ?? 0) + 1,
        "type" => "playlist",
      ]);

    return $this->success("<strong>Alles klar Bruder!</strong>", $Object);
  }

  /**
   * Edits this instance.
   *
   * @param object $params
   * @return string
   */
  public function edit(object $params)
  {

    $this->db_transaction();

    try {

      /**
       * ? Playlist Index
       */
      if (isset($params->playlist_song_index)) {

        /**
         * Playlist is an array?
         */
        if (!is_array($params->playlist_song_index))
          return $this->error("<strong>Kein Array Bruder.</strong>");

        foreach ($params->playlist_song_index as $index => $track_id) :

          /**
           * @var ?PlaylistTrack
           */
          $PlaylistTrack = $this->playlist_tracks
            ->where("track_id", $track_id)
            ->first();

          /**
           * Track is in playlist?
           */
          if (!$PlaylistTrack)
            return $this->error("<strong>Was machst du Bruder?</strong> Track gibts hier gar nicht!");

          /**
           * Update the PlaylistTrack with the new playlist_index
           * and save it.
           */
          $PlaylistTrack->playlist_index = $index;
          $PlaylistTrack->save();
        endforeach;
      }

      $this->db_commit();

      return $this->success("<strong>Playlist ist cool jetzt.</strong>");
    } catch (\Exception $e) {
      $this->db_rollback();

      return $this->error($e->getMessage());
    }
  }

  /**
   * @return string
   */
  public function remove()
  {

    $this->playlist_tracks()->delete();
    $this->bookmark()->delete();
    $this->delete();

    return $this->success("<strong>Is' weg Bruder!</strong>");
  }

  /**
   * @return ?User
   */
  public function user()
  {
    return $this->belongsTo(User::class);
  }

  /**
   * @return ?Collection<PlaylistTrack>
   */
  public function playlist_tracks()
  {
    return $this->hasMany(PlaylistTrack::class);
  }

  /**
   * @return ?Collection<Track>
   */
  public function tracks()
  {
    return $this->belongsToMany(Track::class, 'playlist_tracks', 'playlist_id', 'track_id')
      ->withTimestamps();
  }

  /**
   * @return ?Bookmark
   */
  public function bookmark()
  {
    return $this->hasOne(Bookmark::class, "reference_id", "id");
  }

  /**
   * @return ?object All artworks for albums of tracks in this
   * playlist uniquely grouped.
   */
  public function artworks()
  {

    /**
     * @var Collection<Track>
     */
    return $this->tracks()
      ->with('albums')
      ->whereHas('albums', fn($q) => $q->whereNotNull('art'))
      ->get()
      ->pluck('albums')
      ->flatten()
      ->pluck('art')
      ->unique()
      ->values() ?? null;
  }
}
