<?php

// TODO: Add created_on to track in all songs list.
// TODO: Add times_listened to tracks.
// TODO: Add metadata information overview.
// TODO: Update track metadata (also in actual file).

use Illuminate\Support\Collection;
use Bruder\Model\Track;
use Bruder\Model\Album;
use Bruder\Model\Playlist;

/**
 * @var Track $Track
 * @var ?Playlist $Playlist
 * @var int $index
 * @var int $song_playlist_index
 * @var bool $track_playable
 */

/**
 * @var ?Collection<Album>
 */
$Albums = $Track->albums;

/**
 * @var ?Album
 */
$Album = $Albums?->first();

$track_playable ??= true;
$show_count ??= false;
$song_playlist_index ??= 0;
$show_menu ??= true;
$show_playing ??= true;
$show_listens ??= false;
$length_minutes = $Track->length_seconds / 60;
$in_playlist = $Playlist->id ?? null;
$in_album = CURRENT_PAGE === "album";
$in_artist = CURRENT_PAGE === "artist";
$no_left_action = !$in_playlist && !$show_count && !$in_album && !$in_artist;

/**
 * Includes the variable $show_active to make the track appear
 * different when it's being played right now.
 */
include __DIR__ . "/_show_active.php";

?>

<song
  <?= $show_active ?>
  <?= $show_menu ? "has-menu" : "" ?>
  <?= $in_album ? "in-album" : "" ?>
  <?= !$track_playable ? "display-only" : "" ?>
  track="<?= $Track->id ?>">

  <?php

  /**
   * When reordering songs in a playlist, this comes in handy as
   * we can set a new index for each song based on the place in
   * the array of playlist_song_index[].
   */
  if ($in_playlist) : ?>
    <!---
  Input to track the order inside the playlist. JS will call the script to save a new order automatically when dragging a song to a new place. --->
    <input type=hidden name="playlist_song_index[]" value=<?= $Track->id ?> />
  <?php endif;

  /**
   * + Context Menu
   */
  if ($show_menu)
    include __DIR__ . "/_menu.php"; ?>

  <div
    <?= $no_left_action ? "style=\"padding:4px;padding-right:14px;pointer-events:none;border-radius: 14px 12px 12px 14px;\" background=slighter-light" : "" ?>
    <?= $track_playable ? 'play-track="' . $Track->id . '"' : "" ?>
    content fl alic jucsb gap=smol+ style=flex:1;>
    <div fl alic <?= $no_left_action ? "gap=smol" : "gap" ?> flone flex-truncate>
      <?php if ($show_count) : ?>
        <p text smol track-count style=width:40px;rotate:-90deg;margin-left:-10px;margin-right:-11px; text smoler ttup bold tac><?= $count++; ?></p>
      <?php endif; ?>

      <?php if ($in_playlist): ?>
        <move-track>
          <mi>drag_indicator</mi>
        </move-track>
      <?php endif; ?>

      <?php if (!$in_album) :

        $track_art = $Track->art_link();

      ?>
        <album-art <?= $no_left_action ? "style=margin-right:8px;" : "" ?>>
          <picture size=smol>
            <?php if ($track_art) : ?>
              <img src="<?= $track_art ?>" />
            <?php else : ?>
              <mi>genres</mi>
            <?php endif; ?>
          </picture>
        </album-art>
      <?php endif; ?>

      <div fl alic gap=smol+ flone flex-truncate>
        <div fl fldircol style="margin-top:-6px;" flex-truncate>
          <p title text semibold trimt>
            <?= $Track->title ?>
          </p>
          <div fl alic gap=smoler>
            <p artist text ttup regular fl alic gap=smoler>
              <mi stdplus color=secondary>artist</mi>
              <?= $Track->artistt->name ?>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div fl alic gap=smol>
      <div right-info text smol fl alic gap=smoler>
        <div window-light pinline12 pblock8 rounded=smolplus has-tooltip=left>
          <p text smol semibold fl alic gap=smol>
            <mi color=primary>earbud_right</mi>
            <?= $Track->listens ?: 0  ?>
          </p>
          <div ttooltip text semibold>
            Wie oft gehört
          </div>
        </div>

        <p text smol semibold window-light pblock8 rounded=smolplus no-word-wrap style=width:5.4em; tac>
          <?= $Track->length_formatted(); ?> mins
        </p>
      </div>
      <mi status-icon mid></mi>
    </div>
  </div>
</song>

<?php

$song_playlist_index++;

?>