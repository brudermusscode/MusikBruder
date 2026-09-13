// TODO: Make queue persistent on page reload.
// TODO: Add audio volume normalization.

import * as Frontend from "../framework/frontend";
import * as Cookie from "../framework/cookie";
import * as Global from "../pages/global";

const __duration_track_interval = null;
const __duration_track_reset_timeout = null;
const DEFAULT_VOLUME = 0.2;

const init_color = "#ff47ff";
const error_color = "#ff4769";
const success_color = "#23e934";
const job_color = "#2bbcff";

const current_track_video_path = "current-track cover video";

/**
 * Syncs new files from main directory set in PHP.
 */
export const sync_files = () => {
  let overlay = document.find("syncing-overlay");
  // overlay.activate();

  $.ajax({
    url: "/track/sync",
    method: "POST",
    success: function (data) {
      console.log(`%c▒ ${data.message}`, `color: ${job_color};`);

      if (!data.data.new) {
        document.body.setAttribute("toggled", false);
        overlay.deactivate();

        return;
      }

      overlay.setAttribute("changing", true);
      setTimeout(() => {
        overlay.find("[title]").innerHTML =
          `Hab ${data.data.new} neue gefunden!`;
        overlay.find("[subtext]").innerHTML = "Much wow. So new.";

        overlay.removeAttribute("changing");

        setTimeout(() => {
          window.location.replace("/");
        }, 2000);
      }, 400);
    },
  });
};

/**
 * Pass a track from PHP to set it as the currently playing track
 * in the frontend's player.
 *
 * @param {JSON} Track
 * @param {string} public_source_url
 * @param {bool} init
 * @param {bool} priority
 */
export const play_track = async (
  Track,
  public_url,
  init = false,
  priority = false,
) => {
  return new Promise((resolve) => {
    let player_metadata = Player.find("player-metadata");

    pause();
    remove_current_audio();
    reset_duration_track();

    /**
     * Create a new Audio Object with the requested Track.
     */
    let audio = new Audio(public_url);
    audio.volume = __player.volume;

    /**
     * Set global __player variable values.
     */
    __player.Track.id = Track.id;
    __player.Track.audio = audio;

    /**
     * Set the toggled state of the frontend's player to playing
     * when it's ready. Readyness is checked by loaded metadata state.
     */
    audio.addEventListener("loadedmetadata", () => {
      activate_track_HTMLobjects(Track.id, init ? true : false);

      /**
       * Return here on initialization of the app.
       */
      if (init) return resolve(1);

      set_track(Track);
      kick_duration_track(audio, true);

      audio.play();

      Player.activate();

      playing();

      /**
       * Pause video if the fullscreen player is active.
       */
      if (__player.fullscreen)
        document.find("current-track[has-video] video")?.pause();

      /**
       * Add +1 listens.
       */
      let formdata = new FormData();
      formdata.append("id", Track.id);
      formdata.append("listens", 1);

      $.ajax({
        url: "/track/update",
        data: formdata,
        method: "POST",
      });

      document.title = `🎶 ${Track.artist} × ${Track.title}`;

      console.log(
        `%c▒ Playing Track ID::${Track.id}\n${Track.title}\n${Track.artist}\nDuration: ${(Track.length_seconds / 60).toFixed(2)}min\nVolume: ${__player.volume * 100}%\nQueue: ${priority ? "Priority" : "Regular"}`,
        `color: ${success_color};`,
      );

      return resolve(1);
    });
  });
};

/**
 * Populates all necessary dependencies with the track that is passed.
 * @param {object} Track
 */
export const set_track = (Track) => {
  Cookie.set("__player_Track", Track.id, 365);
};

/**
 * This searches the DOM for a page tag that has an attribute of
 * either [playlist] or [album] and uses the dataset attributes to
 * set the relation of a played song.
 */
export const set_track_relation = (init = false) => {
  let relation_id = null;
  let relation_type = null;

  /**
   * Only set relation to the __player object on page startup.
   */
  if (init) {
    relation_id = Cookie.get("__player_Track_relation_id");
    relation_type = Cookie.get("__player_Track_relation_type");
    __player.Track.relation = {
      id: parseInt(relation_id),
      type: relation_type,
    };

    return;
  }

  /**
   * Set the relations.
   */
  relation_type = document.find("page")?.dataset.type ?? null;
  relation_id = document.find("page")?.dataset.id ?? null;

  /**
   * If no relation was found, delete the cookies and set
   * everything related to null.
   */
  if (!relation_type || !relation_id) {
    Cookie.remove("__player_Track_relation_id");
    Cookie.remove("__player_Track_relation_type");
    __player.Track.relation = {
      id: null,
      type: null,
    };

    return;
  }

  __player.Track.relation = {
    id: parseInt(relation_id),
    type: relation_type,
  };

  Cookie.set("__player_Track_relation_id", relation_id, 365);
  Cookie.set("__player_Track_relation_type", relation_type, 365);
};

/**
 * Finds any [track] and sets it to active state.
 */
export const activate_track_HTMLobjects = (track_id, paused = false) => {
  document.find_all("[track]").forEach((elem) => {
    elem.removeAttribute(paused ? "active" : "paused");

    if (elem.getAttribute("track") == track_id) {
      paused ? elem.setAttribute("paused", true) : elem.activate();
    } else {
      elem.removeAttribute("paused");
      elem.deactivate();
    }
  });
};

/**
 * Simple wrapper function to update the right sidebar with the
 * persistent set cookies without setting new ones or deleting
 * any. It's a simple refresh of the already existing information.
 */
export const update_current_track_w_cookies = async () =>
  Global.update_current_track(null, null, false, true);

/**
 * Searches for a song after the possible currently playing and
 * starts playing it.
 */
export const queue_play_next = async (skipped = false) => {
  if (__player.queue.length < 1 && __player.priority_queue.length < 1) return;

  // ? Priority Queue
  let pq = __player.priority_queue;

  // ? Repeat::single
  if (__player.repeat == "single" && !skipped) return replay();

  // ? Priority Queue
  if (pq.length > 0) return priority_queue_play_next(skipped);

  // ? Base Queue
  let q = __player.queue;
  let current_q_idx = __player.Track.queue_index;
  let next_track_id = q[current_q_idx + 1];
  let will_repeat_queue = __player.repeat == "all" && !next_track_id;
  let next_track_idx = current_q_idx + 1;

  if (will_repeat_queue) {
    console.log(`%c▒ Repeating Queue!`, `color: ${success_color};`);
    next_track_id = __player.queue[0];
    next_track_idx = 0;
  } else if (!next_track_id) {
    //
    // No more songs in queue & no repeat enabled.
    console.log(
      `%c▒ Nothing else to play from Queue!`,
      `color: ${success_color};`,
    );
    return pause();
  }

  let response = await get_Track(next_track_id);
  let Track = response.data.Track;
  let track_public_url = response.data.track_public_url;

  Track.index = next_track_idx;
  __player.Track.queue_index = parseInt(Track.index);

  await play_track(Track, track_public_url, false, false);
  await update_current_track_w_cookies();
};

/**
 * Plays the next song from priority queue.
 *
 * @param {bool} skipped
 */
export const priority_queue_play_next = async () => {
  let pq = __player.priority_queue;

  let response = await get_Track(pq[0]);
  let Track = response.data.Track;
  let track_public_url = response.data.track_public_url;

  // Remove Track from prio queue.
  __player.priority_queue.splice(0, 1);

  await play_track(Track, track_public_url, false, true);

  // Update right sidebar
  await update_current_track_w_cookies();
};

/**
 * Searches for a song before the possible currently playing and
 * starts playing it.
 */
export const queue_play_previous = async () => {
  if (__player.queue.length < 1) return;

  let q = __player.queue;
  let current_q_idx = __player.Track.queue_index;
  let previous_track = q[current_q_idx - 1];

  if (!previous_track) {
    console.log("[queue] No previous tracks!");
    return;
  }

  let response = await get_Track(previous_track);
  let Track = response.data.Track;
  let track_public_url = response.data.track_public_url;

  // Add new index (+1) to Track object.
  Track.index = current_q_idx - 1;

  // Set new index.
  __player.Track.queue_index = parseInt(Track.index);

  // Play the new Track.
  await play_track(Track, track_public_url, false, false);

  // Update right sidebar
  await update_current_track_w_cookies();
};

/**
 * Set anything related to the player to playing.
 */
export const playing = () => {
  __player.active = true;
  Cookie.set("__player_active", 1, 365);
};

/**
 * Set anything related to the player to NOT playing.
 */
export const not_playing = () => {
  __player.active = false;
  Cookie.set("__player_active", 0, 365);
};

/**
 * Replays the currently playing track if one is set.
 */
export const replay = async () => {
  let track_id = __player.Track.id;

  if (!track_id) return;

  let track_response = await get_Track(track_id);

  await play_track(
    track_response.data.Track,
    track_response.data.track_public_url,
    false,
  );

  console.log(`%c▒ Replaying current Track!`, `color: ${success_color};`);
};

/**
 * Start playing if there is a current track set. This will have no effect if there is
 * a track playing and not been paused.
 */
export const resume = () => {
  if (!__player.Track.audio || !__player.Track.id) return;

  // Play the video.
  if (!__player.fullscreen) document.find(current_track_video_path)?.play();

  __player.Track.audio.play();

  Player.activate();

  kick_duration_track(__player.Track.audio);
  set_playing_HTMLobjects();
  playing();
};

/**
 * Searches for any button that could trigger a play or pause of a
 * track and sets it to playing again (active).
 */
export const set_playing_HTMLobjects = () => {
  let buttons = document.find_all("[play-track]");

  buttons?.forEach((button) => {
    if (button.getAttribute("play-track") == __player.Track.id) {
      button.activate();
      button.closest("[track]")?.activate();
      button.closest("[track]").removeAttribute("paused");
    }
  });
};

/**
 * Pauses/Stops the currently playing song and sets any play
 * button for the currently playing song to resume.
 */
export const pause = () => {
  __player.Track.audio?.pause();

  // Pause cover video in sidebar
  document.find(current_track_video_path)?.pause();

  Player.deactivate();

  clearInterval(__duration_track_interval);
  clearTimeout(__duration_track_reset_timeout);

  /**
   * Deactivate ANY preview button when the song gets paused.
   */
  set_paused_HTMLobjects();

  not_playing();
};

/**
 * Searches for any HTMLObject that could trigger a play or pause
 * of a track and sets it to paused state.
 */
export const set_paused_HTMLobjects = () => {
  let buttons = document.find_all("[play-track]");

  buttons?.forEach((button) => {
    if (button.getAttribute("play-track") == __player.Track.id)
      button.closest("[track]").setAttribute("paused", true);

    button.deactivate();
    button.closest("[track]")?.deactivate();
  });
};

/**
 * Finds the only audio element that should be in the DOM and
 * deletes it.
 */
export const remove_current_audio = () => {
  __player.Track.id = null;
  __player.Track.audio = null;
};

/**
 * Loads a track by given :: ID.
 *
 * @param {int} id
 */
export const get_Track = async (id) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `/track/one/${id}`,
      processData: false,
      contentType: false,
      success: function (data) {
        return resolve(data);
      },
      error: function (error) {
        Frontend.ajax_error(error);
        return reject(0);
      },
    });
  });
};

/**
 * Sets the duration track to 0 width and clears all
 * intervals/timeouts that calculate the current width based on
 * the time played of the currently playing song.
 */
export const reset_duration_track = () => {
  let Player = document.find("player");
  let player_track_duration = document.find("player duration-track");

  Player.deactivate();

  clearTimeout(__duration_track_reset_timeout);
  clearInterval(__duration_track_interval);

  player_track_duration.style.width = "0%";
};

/**
 * Kickstarts the duration track of the currently playing song.
 * Respects the current width of a started song, that has played
 * already for some seconds or minutes.
 *
 * @param {HTMLElement} audio_element
 */
export const kick_duration_track = (audio_element, reset = false) => {
  let duration = audio_element.duration;
  let overflow = Player.find("player player-overflow");
  let track = overflow.find("duration-track");

  let overflow_w = parseFloat(getComputedStyle(overflow).width);
  let track_w = parseFloat(getComputedStyle(track).width);
  let current_width = (track_w * 100) / overflow_w;

  // When resetting the width, we need to set it to 0.
  if (reset) current_width = 0;

  let interval_step_ms = 400;
  let total_duration_ms = 1000 * duration;

  // Gets the exact start time in ms.
  let start = performance.now();
  let add_width;

  /**
   * Increase the width of the duration track by x% every 10 ms.
   * See calculation down below.
   */
  __duration_track_interval = setInterval(() => {
    const time_elapsed_ms = performance.now() - start;

    add_width = Math.min(100, (time_elapsed_ms / total_duration_ms) * 100);
    track.style.width = current_width + add_width + "%";

    localStorage.setItem(
      "__player_Track_currentTime",
      __player.Track.audio.currentTime,
    );
  }, interval_step_ms);

  /**
   * After a timeout of the full duration in ms, clear the above
   * interval and set the duration track's width to 0 again!
   */
  let left_duration = audio_element.duration - audio_element.currentTime;
  let total_left_duration_ms = 1000 * left_duration;

  __duration_track_reset_timeout = setTimeout(() => {
    reset_duration_track();
    queue_play_next();
  }, Math.round(total_left_duration_ms));
};

/**
 * Asynchronyously initializes the volume on player startup.
 */
export const init_player_state = async () => {
  return new Promise((resolve) => {
    let Player = document.find("player");
    let volume_controls = document.find("volume-controls");

    // ? Volume
    let current_volume = parseFloat(localStorage.getItem("__player_volume"));

    // Set to default volume, if the saved volume in localStorage is scuffed.
    if (isNaN(current_volume)) current_volume = DEFAULT_VOLUME;

    console.log(
      `%c▒ Initialized Volume: ${current_volume * 100} %`,
      `color: ${init_color};`,
    );

    let parsed_volume = parseFloat(current_volume);

    /**
     * If anything went wrong and the current volume parsed is not
     * a number anymore or its bigger than 1, return the default volume.
     */
    if (isNaN(parsed_volume) || parsed_volume > 1.0)
      parsed_volume = DEFAULT_VOLUME;

    volume_controls.setAttribute("volume", parsed_volume);
    __player.volume = parsed_volume;
    if (__player.Track.audio) __player.Track.audio.volume = parsed_volume;

    /**
     * Set a cookie for persistence.
     */
    Cookie.set("__player_volume", parsed_volume, 365);

    // ? Shuffle
    if (Cookie.get("__player_shuffle") == null)
      Cookie.set("__player_shuffle", 0, 365);
    __player.shuffle = parseInt(Cookie.get("__player_shuffle"));

    console.log(
      `%c▒ Shuffle is ${__player.shuffle ? "enabled" : "disabled"}.`,
      `color: ${init_color};`,
    );

    // ? Repeat::all/single
    let repeat = Cookie.get("__player_repeat");
    if (repeat !== null && repeat !== "single" && repeat !== "all")
      repeat = null;
    __player.repeat = repeat;

    console.log(
      `%c▒ Repeat is ${
        __player.repeat == "all"
          ? "enabled for all songs"
          : __player.repeat == "single"
            ? "enabled for one song"
            : "disabled"
      }.`,
      `color: ${init_color};`,
    );

    return resolve(1);
  });
};

/**
 * Based on the Track.id set in `__player_Track` cookie, this
 * function fetches and sets all necessary dependencies on site
 * load up.
 */
export const init_current_track = async () => {
  return new Promise(async (resolve) => {
    let track_id = Cookie.get("__player_Track");

    /**
     * No cookie set with a recent track id?
     */
    if (!track_id || isNaN(track_id)) {
      console.log(`%c▒ No recent Track found.`, `color: ${init_color};`);
      return resolve(1);
    }

    let Track_response = await get_Track(track_id);

    /**
     * Any error loading current/last track?
     */
    if (!Track_response.status) {
      console.log(`%c▒ Error loading current track.`, `color: ${error_color};`);
      return resolve(1);
    }

    /**
     * Play the current track with an init flag.
     */
    await play_track(
      Track_response.data.Track,
      Track_response.data.track_public_url,
      true,
    );

    /**
     * Get song info in right sidebar.
     */
    let relation_id = Cookie.get("__player_Track_relation_id");
    let relation_type = Cookie.get("__player_Track_relation_type");

    await Global.update_current_track(relation_id, relation_type, true);

    /**
     * Pause the video in right sidebar. It should only play when
     * the song is playing.
     */
    document.find(current_track_video_path)?.pause();

    let time_saved = localStorage.getItem("__player_Track_currentTime");
    if (time_saved) set_time(time_saved);

    console.log(`%c▒ Recent Track found and loaded.`, `color: ${init_color};`);

    return resolve(1);
  });
};

/**
 * Mutes the volume but keeps running.
 */
export const mute = () => {
  set_volume(0.0);
};

/**
 * When unmuting, set the volume to the default.
 */
export const unmute = () => {
  set_volume(DEFAULT_VOLUME);
};

/**
 * Set a specific volume from 0.0 to 1.0.
 * @param {float} volume
 */
export const set_volume = (volume) => {
  if (volume < 0.0 || volume > 1.0) return;

  let controls = document.find("volume-controls");
  let parsed_volume = volume.toFixed(1);

  __player.volume = parsed_volume;
  controls.setAttribute("volume", parsed_volume);
  localStorage.setItem("__player_volume", parsed_volume);
  Cookie.set("__player_volume", parsed_volume, 365);
  console.log(`Volume: ${Math.round(__player.volume * 100)}%`);

  if (__player.Track.audio) __player.Track.audio.volume = parsed_volume;

  Frontend.create_responder("<strong>" + parsed_volume * 100 + " %</strong>");
};

export const volume_up = () => {
  set_volume(parseFloat(localStorage.getItem("__player_volume")) + 0.1);
};

export const volume_down = () => {
  set_volume(parseFloat(localStorage.getItem("__player_volume")) - 0.1);
};

/**
 * Toggles shuffle mode.
 */
export const shuffle = () => {
  if (Cookie.get("__player_shuffle") == 1) {
    Cookie.set("__player_shuffle", 0, 365);
    __player.shuffle = 0;

    return 0;
  } else {
    Cookie.set("__player_shuffle", 1, 365);
    __player.shuffle = 1;

    return 1;
  }
};

/**
 * Toggle repeat mode. Evaluates either repeating all, only one or
 * not at all.
 */
export const repeat = () => {
  let cookie = "__player_repeat";
  let repeat = Cookie.get(cookie);

  if (repeat == "all") repeat = "single";
  else if (repeat == "single") repeat = null;
  else repeat = "all";

  __player.repeat = repeat;
  Cookie.set(cookie, repeat, 365);

  return repeat;
};

/**
 * Update the queue based on the currently playing
 */
export const create_queue = async (
  type = null,
  id = null,
  track_id,
  shuffle = false,
) => {
  return new Promise((resolve) => {
    let formdata = new FormData();
    formdata.append("type", type);
    formdata.append("id", id);
    formdata.append("track_id", track_id);

    if (shuffle) formdata.append("shuffle", true);

    $.ajax({
      url: "/queue/create",
      data: formdata,
      method: "POST",
      success: function (data) {
        if (data.status) {
          __player.queue = data.data.Queue;
          __player.Track.queue_index = data.data.index;

          console.log(
            `%c▒ Queue created${shuffle ? " shuffled" : ""}.`,
            `color: ${init_color};`,
          );
          return resolve(1);
        }

        if (data.message !== "no_track") {
          Frontend.ajax_response("error");
          console.log(`%c▒ Queue creation failed.`, `color: ${error_color};`);
        }

        return resolve(0);
      },
    });
  });
};

export const set_time = (seconds) => {
  let track = document.find("player duration-track");
  let percent_width = (seconds * 100) / __player.Track.audio.duration;
  let should_resume = __player.active;

  pause();

  // Change visible track width.
  track.style.width = percent_width + "%";

  // Change actual <audio> time.
  __player.Track.audio.currentTime = seconds;

  // Save the new time to the localStorage.
  localStorage.setItem("__player_Track_currentTime", seconds);

  // Waiting 120 ms to not interfere with the css animations.
  if (should_resume)
    setTimeout(() => {
      resume();
    }, 120);
};

/**
 * Tells us if a track has been clicked on and all references are populated.
 */
export const track = () => {
  return __player.Track.id;
};

document.addEventListener("DOMContentLoaded", async function () {
  /**
   * Set lib view.
   */
  if (!Cookie.get("__lib_view")) {
    document.find("library").setAttribute("view", "list");
    document.find("library-view [view=list]").activate();
    Cookie.set("__lib_view", "list", 365);
  }

  Cookie.set("__player_active", 0, 365);

  set_track_relation(true);
  await init_player_state();
  await init_current_track();

  /**
   * On page initialization, create the queue from saved Track and
   * Relation saved in cookies. Skip, if either of one doesn't exist.
   */
  if (__player.Track.id)
    await create_queue(
      __player.Track.relation.type,
      __player.Track.relation.id,
      __player.Track.id,
      __player.shuffle,
    );

  console.log(`%c▒ Everything loaded!`, `color: ${success_color};`);

  sync_files();
});

$(function () {
  //
  //
  /**
   * Clicking on a Track HTML object!
   *
   * @action GET
   * @controller TracksController
   * @model Track
   */
  $(document).on("click", "[play-track]", async function (e) {
    let track_id = this.getAttribute("play-track");

    /**
     * If the same Track saved in __player is clicked, just resume
     * it and return.
     */
    if (track_id == __player.Track.id)
      return document.find("player [play]")?.click();

    // Get the Track.
    let response = await get_Track(track_id);

    if (!response.status) return Frontend.create_responder(response.error);

    // ? Play Track
    await play_track(response.data.Track, response.data.track_public_url);

    // ? Queue + Current Track
    let relation_id = this.closest("page")?.dataset.id ?? null;
    let relation_type = this.closest("page")?.dataset.type ?? null;

    // The shuffle will always prioritize the cookie, which will
    // be set to 0 if not set at all. The __player object will
    // always take the value of the cookie.
    let cookie_shuffle = parseInt(Cookie.get("__player_shuffle") ?? "0");
    if (__player.shuffle !== cookie_shuffle) {
      Cookie.set("__player_shuffle", cookie_shuffle, 365);
      __player.shuffle = cookie_shuffle;
    }

    set_track_relation(false);
    await create_queue(relation_type, relation_id, track_id, cookie_shuffle);
    await Global.update_current_track(relation_id, relation_type);
  });

  /**
   * Show a time label when hovering over a part of the player overflow holding the
   * duration-track to indicate, where the song will start playing when clicking.
   */
  $(document).on("mouseover, mousemove", "player-overflow", function (e) {
    if (!track()) return;

    let w = parseFloat(getComputedStyle(this).width);
    let x = e.originalEvent.layerX;
    let label = document.find("time-label");
    let duration_sec = __player.Track.audio.duration;
    let percent = (x * 100) / w;
    let hovered_seconds = Math.floor(duration_sec * (percent / 100));
    let minutes = Math.floor(hovered_seconds / 60);
    let seconds = hovered_seconds % 60;

    let time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    label.activate();
    label.style.left = x + 38 + "px";
    label.innerHTML = time;
  });

  $(document).on("mouseout", "player-overflow", function (e) {
    let label = document.find("time-label");

    label.deactivate();
  });

  /**
   * Set new time for the currently playing track when clicking on the duration-track.
   */
  $(document).on("click", "player-overflow", function (e) {
    if (!track()) return;

    let duration = __player.Track.audio.duration;
    let track_width = parseFloat(getComputedStyle(this).width);
    let layer_clicked_x = e.originalEvent.layerX;
    let percent_width = (100 * layer_clicked_x) / track_width;
    let new_audio_time_sec = duration * (percent_width / 100);

    set_time(new_audio_time_sec);
  });

  /**
   * Toggles shuffle mode by click on a button and shows the
   * button element based on the returned value of the shuffle() function.
   */
  $(document).on("click", "[player-repeat]", function (e) {
    let r = repeat();
    this.setAttribute("repeat", r);

    if (r === "single" || r === "all") this.activate();
    else this.deactivate();
  });

  /**
   * Toggles shuffle mode by click on a button and shows the
   * button element based on the returned value of the shuffle() function.
   */
  $(document).on("click", "[player-shuffle]", function (e) {
    let shuff = shuffle();

    if (shuff === 1) this.activate();
    else this.deactivate();

    let relation_type = __player.Track?.relation?.type ?? null;
    let relation_id = __player.Track?.relation?.id ?? null;
    let track_id = __player.Track?.id;

    create_queue(relation_type, relation_id, track_id, shuff);
  });

  let __cursor_move_timeout_fullscreen_player;
  let __cursor_move_timeout_fullscreen_player_ms = 2000;

  $(document).on("mousemove click", "player[fullscreen]", function (e) {
    clearTimeout(__cursor_move_timeout_fullscreen_player);

    if (!this.hasAttribute("cursor-moved"))
      this.setAttribute("cursor-moved", true);

    __cursor_move_timeout_fullscreen_player = setTimeout(() => {
      this.removeAttribute("cursor-moved");
    }, __cursor_move_timeout_fullscreen_player_ms);
  });

  /**
   * Resizes the player to the fullscreen version.
   */
  $(document).on(
    "click",
    "fullscreen-player, fullscreen-player-close",
    function (e) {
      clearTimeout(__cursor_move_timeout_fullscreen_player);

      if (!Player.hasAttribute("fullscreen")) {
        Global.close_bruder();
        Player.setAttribute("fullscreen", true);
        Player.setAttribute("cursor-moved", true);

        __player.fullscreen = 1;

        /**
         * Stop video playback, if a song is currently playing.
         */
        if (__player.active)
          document.find("current-track[has-video] video")?.pause();

        __cursor_move_timeout_fullscreen_player = setTimeout(() => {
          this.removeAttribute("cursor-moved");
        }, __cursor_move_timeout_fullscreen_player_ms);
      } else {
        Player.removeAttribute("fullscreen");
        Player.removeAttribute("cursor-moved");

        __player.fullscreen = 0;

        /**
         * Start video playback, if a song is currently playing.
         */
        if (__player.active)
          document.find("current-track[has-video] video")?.play();
      }
    },
  );

  /**
   * Toggles the players visibility.
   */
  $(document).on("click", "[data-action='player:hide']", function (e) {
    let show_button = document.find("show-player");

    if (!Player.hasAttribute("collapsed")) {
      Player.setAttribute("collapsed", true);
      show_button.setAttribute("collapsed", true);
      Cookie.set("__player_collapsed", 1, 365);
    } else {
      Player.removeAttribute("collapsed");
      show_button.removeAttribute("collapsed");
      Cookie.set("__player_collapsed", 0, 365);
    }
  });

  /**
   * Toggle play/pause.
   */
  $(document).on("click", "player [play]", function (e) {
    let Player = document.find("player");

    if (Player.hasAttribute("active")) pause();
    else resume();
  });

  /**
   * Play next song in queue.
   */
  $(document).on("click", "[play-next]", async function (e) {
    await queue_play_next(true);
  });

  /**
   * Play next song in queue.
   */
  $(document).on("click", "[play-previous]", async function (e) {
    await queue_play_previous();
  });

  /**
   * Increase the volume of the currently playing track and set it globally.
   */
  $(document).on("click", "[volume-up]", function () {
    volume_up();
  });

  /**
   * Decrease the volume of the currently playing track and set it globally.
   */
  $(document).on("click", "[volume-down]", function () {
    volume_down();
  });

  /**
   * Mute volume.
   */
  $(document).on("click", "[volume-mute]", function (e) {
    if (__player.volume == 0.0) unmute();
    else mute();
  });
});
