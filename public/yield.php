<?php

use Bruder\Application\Cookie;

/**
 * Require the main initialization file.
 */
require_once dirname(__DIR__) . "/config/init.php";

/**
 * Sanitizes the output for non DEV environments. Looks so cool
 * when going to the source code!
 */
if (PROD)
  ob_start("sanitize_output");

?>

<!DOCTYPE html>
<html lang=en>

<?php

/**
 * Create the correct canocial for google by removing the query string.
 */
$canonical = explode("?", $_SERVER["REQUEST_URI"]);
$canonical = HOME_URL . ($canonical[0] ?? "");

?>

<head>
  <link rel="canonical" href="<?= $canonical ?>" />
  <link rel="home" href="<?php echo HOME_URL; ?>" />
  <link rel="icon" type="image/x-icon" href="/favicon.svg" />

  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="csrf_token" content="<?php echo $csrf_token; ?>" />

  <!--- Tell IE to render webpage for edge --->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="application-name" content="<?php echo APP_NAME; ?>">

  <title><?= CURRENT_PAGE_TITLE ?></title>

  <?php

  /**
   * Include SEO stuff from the environment only if activated.
   */
  if (_env("SEO_ACTIVATED")) : ?>
    <meta name="keywords" content="<?php echo _env("SEO_KEYWORDS"); ?>" />
    <meta name="description" content="<?php echo $og->desc ?? _env("SEO_DESCRIPTION"); ?>" />
  <?php endif;

  /**
   * Any js and css file.
   */
  include TEMPLATE . "/global/_yield-requires.php"; ?>
</head>

<body toggled="true" initialized="false" mobile="false"
  theme="<?= Cookie::get("__theme") === "light" ? "light" : "dark" ?>"
  style="background-image: url(/assets/images/purple.jpg);">

  <background-blur></background-blur>

  <ajax-response></ajax-response>

  <?php

  /**
   * + Mobile player.
   */
  // include TEMPLATE . "/global/_player-mobile.php";

  /**
   * + Synchronization overlay
   */
  include TEMPLATE . "/global/_startup-overlay.php";

  /**
   * + Music Player
   */
  include TEMPLATE . "/global/_player.php";

  /**
   * + Frontend.load();
   */
  include TEMPLATE . "/global/_page-loader.html";

  /**
   * + Header
   */
  include TEMPLATE . "/global/_header.php";

  /**
   * + Sidebar
   */
  include TEMPLATE . "/global/_sidebar.php";

  /**
   * + Loaded Template - Dynamically updated on page load.
   */
  echo <<<HTML
    <main>
      $_INCLUDE_TEMPLATE
    </main>
  HTML; ?>

  <script type="text/javascript">
    const Player = document.find("player");
  </script>

</body>

</html>

<?php

include TEMPLATE . "/global/_yield-end.php";
