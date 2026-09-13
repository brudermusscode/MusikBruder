<?php

use Bruder\Application\Cookie;

?>

<time-label background=light color=dark text smol bold pinline10 pblock6 rounded=smolplus elevated=wide></time-label>

<header fl w100 alic jucsb gap=smol>
  <div fl alic gap=smol>
    <theme-switcher <?= Cookie::get("__theme") === "light" ? "" : "active" ?>>
      <mi></mi>
    </theme-switcher>

    <dot-divider></dot-divider>

    <a circled href="/">
      <mbutton material size=mid icon-only has-tooltip=bottom
        page=home <?= CURRENT_PAGE === "home" || !CURRENT_PAGE || CURRENT_PAGE === "/" ? "active" : "" ?>>
        <mi>newsstand</mi>
        <div ttooltip>Alles</div>
      </mbutton>
    </a>

    <a circled href="/albums">
      <mbutton material size=mid icon-only has-tooltip=bottom
        page=albums <?= CURRENT_PAGE === "albums" ? "active" : "" ?>>
        <mi>album</mi>
        <div ttooltip>Alben</div>
      </mbutton>
    </a>
  </div>
</header>