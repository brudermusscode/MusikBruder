<?php

use Bruder\Application\Cookie;

?>

<player-contain fl alic gap=smol>
  <div player-tools>
    <mbutton material size=midler icon-only has-tooltip=bottom no-hover-shadow
      player-repeat
      repeat=<?= Cookie::get("__player_repeat") ?? "\"\"" ?>
      <?= in_array(Cookie::get("__player_repeat"), ["all", "single"])
        ? "active" : "" ?>>
      <mi></mi>
      <div ttooltip text regular></div>
    </mbutton>

    <mbutton material size=midler icon-only has-tooltip=bottom player-shuffle no-hover-shadow <?= Cookie::get("__player_shuffle") ? "active" : "" ?>>
      <mi>shuffle</mi>
      <div ttooltip text regular>
        Shuffle?
      </div>
    </mbutton>
  </div>

  <dot-divider></dot-divider>

  <!--- Volume will be populated by js. --->
  <player <?= Cookie::get("__player_collapsed") == 1 ? "collapsed" : "" ?>>
    <player-content fl alic jucc>

      <fullscreen-player-close>
        <mi midplus>close</mi>
      </fullscreen-player-close>

      <player-overflow>
        <duration-track></duration-track>
      </player-overflow>

      <player-actions fl alic gap=smol>
        <mbutton play-previous previous hoverable no-hover-shadow>
          <mi>chevron_backward</mi>
        </mbutton>
        <play-button play>
          <mi></mi>
        </play-button>
        <mbutton play-next next hoverable no-hover-shadow>
          <mi>chevron_forward</mi>
        </mbutton>
      </player-actions>
    </player-content>
  </player>

  <dot-divider></dot-divider>

  <volume-controls fl alic gap=smol volume="<?= CURRENT_VOLUME ?>">
    <mbutton material icon-only size=midler volume-display volume-mute>
      <div muted></div>
      <mi style=font-size:1.4em;></mi>
    </mbutton>
    <div controls elevated window-light>
      <mbutton volume-down material size=midler icon-only hoverable>
        <mi>remove</mi>
      </mbutton>
      <mbutton volume-up material size=midler icon-only hoverable>
        <mi>add</mi>
      </mbutton>
    </div>
  </volume-controls>
</player-contain>