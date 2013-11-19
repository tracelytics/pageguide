pageguide.js
============

An interactive guide for web page elements using jQuery and CSS3. Check it out IRL at http://tracelytics.github.com/pageguide!

## Table of Contents
* [How-To](#how-to)
* [An Example](#an-example)
* [Options](#options)
* [Requirements](#requirements)
* [Tested In](#tested-in)
* [Contribute](#contribute)
* [License](#license)

## How-To:
1. Add references in your code to pageguide.js, jQuery & pageguide.css
2. Add a document ready callback to setup the page guide
3. Add a simple `<ul>` to the bottom of the pages you want the pageguide to appear on.
4. Customize the page guide tour title.
5. (Optional) Add a welcome message to display to your users on page load.

## An Example:

### Step 1 - Add pageguide.js

Add `<script src="pageguide.js"></script>` to the bottom of your html document, right before your closing `</body>` tag.

We provide both the standard js as well as a minified version.

### Step 2 - Add pageguide.css

Add `<link rel="stylesheet" href="stylesheets/pageguide.css">` to the header of your html document.

We provide a css file as well as a minified version. Alternatively, we use <a href="http://lesscss.org/" target="_blank">LESS CSS</a> at Tracelytics, so we provide that as well.

### Step 3 - Add setup code

Add the following block of JavaScript to your html document:

```$(document).ready(function() {
    tl.pg.init({ /* optional preferences go here */ });
});```

### Step 4 - Choose the elements that you want included in the page guide.
pageguide.js matches the first occurrence of the selector you specify in the `<ul>` you put on your pages in the next step.

### Step 5 - Add the pageguide.js `<ul>` near the bottom of your pages.

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

### Step 6 (optional) - Add `#tlyPageGuideWelcome` near the bottom of your page.

    <div id="tlyPageGuideWelcome">
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

This element will display as an introductory welcome modal to your users when they visit your page. There are three elements you can include inside `#tlyPageGuideWelcome` to let users control its behavior:
- `.tlypageguide_start` (required): Closes the welcome modal and launches pageguide.
- `.tlypageguide_ignore` (optional): Simply closes the welcome modal.
- `.tlypageguide_dismiss` (optional): Closes the welcome modal and never shows it again.

By default, the modal will continue to launch on page load until a user either a) launches pageguide, or b) dismisses the message by clicking `.tlypageguide_dismiss`. User preference for a particular URL is stored in localStorage with a cookie fallback.

## Options

Pageguide can take a hash of options in `init()`. All are optional.

<table>
    <tr>
		<th>Option</th>
		<th>Type</th>
		<th>Default</th>
		<th>What it do</th>
	</tr>
	<tr>
		<td><code>auto_show_first</code></td>
		<td>boolean</td>
		<td><code>true</code></td>
		<td>Whether or not to focus on the first visible item immediately on PG open</td>
	</tr>
	<tr>
		<td><code>loading_selector</code></td>
		<td>selector</td>
		<td><code>'#loading'</code></td>
		<td>The CSS selector for the loading element. pageguide will wait until this element is no longer visible starting up.</td>
	</tr>
	<tr>
		<td><code>track_events_cb</code></td>
		<td>function</td>
		<td>noop</td>
		<td>Optional callback for tracking user interactions with pageguide.  Should be a method taking a single parameter indicating the name of the interaction. (default none)</td>
	</tr>
    <tr>
    	<td><code>handle_doc_switch</code></td>
		<td>function</td>
		<td><code>null</code></td>
		<td>Optional callback to enlight or adapt interface depending on current documented element. Should be a function taking 2 parameters, current and previous data-tourtarget selectors. (default null)</td>
	</tr>
    <tr>
    	<td><code>custom_open_button</code></td>
		<td>selector</td>
		<td><code>null</code></td>
		<td>Optional id for toggling pageguide. Default null. If not specified then the default button is used.</td>
	</tr>
    <tr>
    	<td><code>pg_caption</code></td>
		<td>string</td>
		<td><code>page guide</code></td>
		<td>Optional - Sets the visible caption</td>
	</tr>
    <tr>
    	<td><code>dismiss_welcome</code></td>
		<td>function</td>
		<td>(see source)</td>
		<td>Optional function to permanently dismiss the welcome message, corresponding to <code>check_welcome_dismissed</code>. Default: sets a localStorage or cookie value for the (hashed) current URL to indicate the welcome message has been dismissed, corresponds to default <code>check_welcome_dismissed</code> function.</td>
	</tr>
    <tr>
        <td><code>check_welcome_dismissed</code></td>
		<td>function</td>
		<td>(see source)</td>
		<td>Optional function to check whether or not the welcome message has been dismissed. Must return true or false. This function should check against whatever state change is made in dismiss_welcome. Default: checks whether a localStorage or cookie value has been set for the (hashed) current URL, corresponds to default dismiss_welcome function.</td>
	</tr>
</table>

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
