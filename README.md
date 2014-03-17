pageguide.js
============

An interactive, responsive, and smart guide for web page elements using jQuery and CSS3. Works great for dynamic pages and single-page apps as well as static pages. Check it out IRL at http://tracelytics.github.com/pageguide!

[![Build Status](https://travis-ci.org/tracelytics/pageguide.png)](https://travis-ci.org/tracelytics/pageguide)

## Table of Contents
* [Quick Start](#quick-start)
* [How-To](#how-to)
* [An Example](#an-example)
* [Options](#options)
* [Requirements](#requirements)
* [Tested In](#tested-in)
* [Contribute](#contribute)
* [License](#license)

## Quick Start

Three quick start options are available:

* Download the latest [release](https://github.com/tracelytics/pageguide/releases)
* Clone the repo: `git clone https://github.com/tracelytics/pageguide.git`
* Install with [Bower](http://bower.io/): `bower install pageguide`

Read the [Getting Started](http://tracelytics.github.io/pageguide/) page for information on the framework contents and more.

## How-To:
1. Add references in your code to jQuery, pageguide.min.js & pageguide.min.css
2. Add a single pageguide `init()` call within a `document.ready` callback.
3. Add a simple `<ul>` to the bottom of the pages you want the pageguide to appear on.
4. Customize the page guide tour title.
5. (Optional) Add a welcome message to display to your users on page load.

## An Example:

### Step 1 - Add pageguide js

Add `<script src="{YOUR_PATH}/pageguide.min.js"></script>` to the bottom of your html document, right before your closing `</body>` tag.

Minified js is located in /dist/js/ (the source file is in /js/).

### Step 2 - Add pageguide.css

Add `<link rel="stylesheet" href="{YOUR_PATH}/pageguide.css">` to the header of your html document.

Minified css can be found in /dist/css/. Source LESS file is in /less/.

### Step 3 - Add setup code

Add the following block of JavaScript to your html document:

```$(document).ready(function() {
    tl.pg.init({ /* optional preferences go here */ });
});```

### Step 4 - Choose the elements that you want included in the page guide.
pageguide.js matches the first occurrence of the selector you specify in the `<ul>` you put on your pages in the next step.

### Step 5 - Add the pageguide.js `<ul>` near the bottom of your pages.
The `data-tourtarget` attribute for each `<li>` should contain the selector for the element you wish to target with this step. Optional: use the classes `tlypageguide_left`, `tlypageguide_right`, `tlypageguide_top`, or `tlypageguide_bottom` to position the step indices.

    <ul id="tlyPageGuide" data-tourtitle="REPLACE THIS WITH A TITLE">
      <li class="tlypageguide_left" data-tourtarget=".first_element_to_target">
        <div>
          Here is the first item description. The number will appear to the left of the element.
        </div>
      </li>
      <li class="tlypageguide_right" data-tourtarget="#second_element_to_target">
        <div>
          Here is the second item description. The number will appear to the right of the element.
        </div>
      </li>
      <li class="tlypageguide_top" data-tourtarget=".third_element_to_target > div.is_here">
        <div>
          Here is the third item description. The number will appear above the element.
        </div>
      </li>
      <li class="tlypageguide_bottom" data-tourtarget="#fourth_element_to_target">
        <div>
          Here is the fourth item description. The number will appear below the element.
        </div>
      </li>
    </ul>

### Step 6 (optional) - Add `.tlyPageGuideWelcome` near the bottom of your page.

    <div class="tlyPageGuideWelcome">
        <p>Here's a snappy modal to welcome you to my new page! pageguide is here to help you learn more.</p>
        <p>
            This button will launch pageguide:
            <button class="tlypageguide_start">let's go</button>
        </p>
        <p>
            This button will close the modal without doing anything:
            <button class="tlypageguide_ignore">not now</button>
        </p>
        <p>
            This button will close the modal and prevent it from being opened again:
            <button class="tlypageguide_dismiss">got it, thanks</button>
        </p>
    </div>

This element will display as an introductory welcome modal to your users when they visit your page. There are three elements you can include inside `.tlyPageGuideWelcome` to let users control its behavior:
- `.tlypageguide_start` (required): Closes the welcome modal and launches pageguide.
- `.tlypageguide_ignore` (optional): Simply closes the welcome modal.
- `.tlypageguide_dismiss` (optional): Closes the welcome modal and never shows it again.

By default, the modal will continue to launch on page load until a user either a) launches pageguide, or b) dismisses the message by clicking `.tlypageguide_dismiss`. User preference for a particular URL is stored in localStorage with a cookie fallback.

## Options

Pageguide can take a hash of options in `init()`. All are optional.

Option | Type | Default | What it do
-------|------|---------|-----------
`auto_show_first` | boolean | `true` | Whether or not to focus on the first visible item immediately on PG open
`loading_selector` | selector | `'#loading'` | The CSS selector for the loading element. pageguide will wait until this element is no longer visible before starting up.
`track_events_cb` | function | noop | Optional callback for tracking user interactions with pageguide. Should be a method taking a single parameter indicating the name of the interaction. (default none)
`handle_doc_switch` | function | `null` | Optional callback to enlight or adapt interface depending on current documented element. Should be a function taking 2 parameters, current and previous data-tourtarget selectors. (default null)
`custom_open_button` | selector | `null` | Optional id for toggling pageguide. Default null. If not specified then the default button is used.
`pg_caption` | string | `'page guide'` | Optional - sets the visible caption
`dismiss_welcome` | function | (see source) | Optional function to permanently dismiss the welcome message, corresponding to `check_welcome_dismissed`. Default: sets a localStorage or cookie value for the (hashed) current URL to indicate the welcome message has been dismissed, corresponds to default `check_welcome_dismissed` function.
`check_welcome_dismissed` | function | (see source) | Optional function to check whether or not the welcome message has been dismissed. Must return true or false. This function should check against whatever state change is made in `dismiss_welcome`. Default: checks whether a localStorage or cookie value has been set for the (hashed) current URL, corresponds to default `dismiss_welcome` function.
`ready_callback` | function | `null` | A function to run once the pageguide ready event fires.
`pointer_fallback` | boolean | `true` | Specify whether or not to provide a fallback for css pointer-events in browsers that do not support it.
`default_zindex` | number | `100` | The css z-index to apply to the tlypageguide_shadow overlay elements
`steps_element` | selector | `'#tlyPageGuide'` | Selector for the ul element whose steps you wish to use in this particular pageguide object
`auto_refresh` | boolean | `false` | If set to true, pageguide will run a timer to constantly monitor the DOM for changes in the target elements and adjust the pageguide display (bubbles, overlays, etc) accordingly. The timer will only run while pageguide is open. Useful for single-page or heavily dynamic apps where pageguide steps or visible DOM elements can change often.
`welcome_refresh` | boolean | `false` | Similar to auto_refresh, welcome_refresh enables a timer to monitor the DOM for new .tlyPageGuideWelcome elements. This is useful if your welcome element isn't loaded immediately, or if you want to show different welcome elements on different pages. The timer will run constantly, whether or not the pageguide is open, so enable at your discretion.
`refresh_interval` | number | `500` | If auto_refresh or welcome_refresh is enabled, refresh_interval indicates in ms how often to poll the DOM for changes.

## Requirements

* jQuery 1.7 - 2.0

## Tested In:

* OSX
  * Chrome 26
  * Firefox 20
  * Safari 6.0.4

## Contribute
Bugfix?  Cool new feature?  Alternate style?  Send us a pull request!

Below are some instructions for developing with pageguide.js:

1. Make sure [Node.js](http://nodejs.org/) is installed. We recommend you use [NVM](https://github.com/creationix/nvm).

1. Clone pageguide.js

    ```bash
    $ git clone git@github.com:tracelytics/pageguide.git
    $ cd pageguide
    ```

1. We use [Grunt](http://gruntjs.com/) to develop, test, and compile pageguide.js
   into `/dist`:

    ```bash
    $ cd pageguide
    $ npm install -g grunt-cli
    $ npm install
    $ grunt
    ```

1. Create a feature branch and make some code changes

1. Add unit tests (in `/js/test/unit`) and ensure your tests pass by running
   `grunt`.

1. Send us a detailed pull request explaining your changes.

## License
Copyright (c) 2013 Tracelytics, AppNeta

Pageguide is freely redistributable under the MIT License. See LICENSE for details.
