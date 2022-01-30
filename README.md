# MMM-Tools
Display stats on MagicMirror, MMM-TelegramBot supported.

## Screenshots
![](https://github.com/bugsounet/MMM-Tools/blob/dev/capture/capture3.png)

on `MagicMirror`

![](https://github.com/bugsounet/MMM-Tools/blob/dev/capture/capture4.png)

on `Telegram`

## Features
- Display system status on `MagicMirror`
- `MMM-TelegramBot` command: `/status`
- `MMM-TelegramBot` warning
- Multi-language supported 
  * `en`, `it`, `fr`, `sv`, `id`, `de`, `cs`, `da`, `nl`
  * For your own language make a `Pull Request` or `Issue` and translate the [english](https://github.com/bugsounet/MMM-Tools/blob/dev/translations/en.json) default file. I will add it :)

## Install, update and upgrade
Read the [wiki](http://wiki.bugsounet.fr/en/MMM-Tools)

## Change logs:

* 2022/01/30: v2.1.2
  * Allow to display used node and npm version

* 2021/12/04: v2.1.1
  * update `de.json` language file (thx to @lxne)

* 2021/11/19: v2.1.0
  * Add: Display CPU Speed
  * Display CPU Governor
  * No wait on start !
  * Change display of RPI (now detected/ displayed with library)
  * review `/status` of TelegramBot with new values

* 2021/10/31: v2.0.11
  * Add: optional feature for visual CPU Temp to Fahrenheit
  * Add: Display MagicMirror version

* 2021/10/10: v2.0.10
  * Add: `nl` translation

* 2021/10/05: v2.0.7 to v2.0.9
  * Add: `da` translation
  * Modify css see all value with opacity
  * Fix: Apply new rules for "fs" library (save uptime data)

* 2021/04/04: v2.0.6
  - Minor css correct

* 2021/04/03 : v2.0.4-v2.0.5
  - Correct Display with break Change of the new library
  - added Spanish translation (thx to CalcU)

* 2020/09/04: v2.0.2-v2.0.3
  - Correct TelegramBot parse entities error
  - add cs.json translation (thx to @majsoft)

* 2020/08/22: v2.0.1
  - Correct average CPU

* 2020/08/20: v2.0.0
  - refact all core code
  - initial Release

## Command For `MMM-TelegramBot`
|command | description
|--- |---
|`/status` | Show system status

## Donate
 [Donate](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TTHRH94Y4KL36&source=url), if you love this module ! :)
