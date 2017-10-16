# MMM-Tools
Dsiplay stats and remote controlling MagicMirror on SBC(ATB &amp; RPI), MMM-TelegramBot supported.

## Screenshots
![](https://github.com/eouia/MMM-Tools/blob/master/capture2.jpg)

on `MagicMirror`

![](https://github.com/eouia/MMM-Tools/blob/master/capture1.jpg) ![](https://github.com/eouia/MMM-Tools/blob/master/capture4.jpg)

on `Telegram`

## Feature
- Display system status on `MagicMirror`
- `MMM-TelegramBot` commands, `/status` and `/screen on|off` are supported.
- You can set alert threshold for abnormal status of `MagicMirror`. You can get warning message by `notification` and `TelegramBot`

## Install
```sh
cd [YourMagicMirrorDirectory]/modules
git clone https://github.com/eouia/MMM-Tools
```

If you want to use screen capture function, you should install `scrot` additionally.
```sh
sudo apt-get install scrot
```

## Configuration
```javascript
{
  module: 'MMM-Tools',
  position: 'bottom_right',
  config: {
    device : "ATB", // "RPI" is also available
    refresh_interval_ms : 10000,
    warning_interval_ms : 1000 * 60 * 5,
    enable_warning : true,
    warning : {
      CPU_TEMPERATURE : 65,
      GPU_TEMPERATURE : 65,
      CPU_USAGE : 75,
      STORAGE_USED_PERCENT : 80,
      MEMORY_USED_PERCENT : 80
    }
  }
}
// For more detailed information, see below;
```

### Detailed Configuration
|field | default | description
|--- |--- |---
|device | `"ATB"` | `"ATB"` for **Asus TinkerBoard (TinkerOS)**, <br/>`"RPI"` for **Raspberry Pi (Raspbian)**.
|refresh_interval_ms | `10000` | Milliseconds for refreshing status informaion on `MagicMirror`
|warning_interval_ms | `300000` | Milliseconds for preventing multiple warning message. After passing this duration from previous warning messages, same warning message will be sent.
|enable_warning | `true` | Set for sending warning message (notification and `TelegramBot` message)
|warning | See the below | Threshold values for warning message
#### warning
|fields | default | description
|--- |--- |---
| CPU_TEMPERATURE | `65` | Set CPU or SoC temperature for warning
| GPU_TEMPERATURE | `65` | Set GPU temperature for warning
| CPU_USAGE | `75` | Set % of CPU Usage (ref. `/proc/stat`) for warning
| STORAGE_USED_PERCENT | `80` | Set % of used space of storage(SD Card) for warning
| MEMORY_USED_PERCENT | `80` | Set % of used space of memory(RAM) for warning

## Commands (For `MMM-TelegramBot`)
|command | description
|--- |---
|`/status` | Show system status
|`/screen on` | Turn display on
|`/screen off` | Turn display off
|`/capture` | Get current `MagicMirror` screenshot

## Customizing view
You can customize view of this module with `CSS`. See the `MMM-Tools.css`
```css
 .Tools .status_item.status_ip {
   order: 1; // change order
   /* display : none; */ //set display
 }
```

## For Asus Tinker Board user
- on current TinkerOs (v 1.9), there is no `vgcencmd`, `vbetool`, `tvservice` or equivalents. So I should use `xset` for controlling screen.
- First you should set your xset dpms and screensaver on boot like this.
```sh
xset s noblank
xset s off
xset -dpms

xset s 0 0
xset dpms 0 0 0
```
There is no `/boot/config.text` in TinkerOS unlike Raspbian. I use `Xfce Power Manager` on TinkerOS LXDE desktop. (`Preference > Power Manager` menu)
Set `Blank after` and `Put to sleep after` and `Switch off after` by `Never`. It works.
- If you have any good idea for controling screen, please tell me.


## For Raspberry Pi(Raspbian) user
- Don't forget setting `device:"RPI",` in `config.js`
- I have no RPI currently, so I cannot test enough. Please test and report issue for this module.
- I'm not an expert as SysAdmin, thus I don't know the best way to detect and control screen on Raspberry Pi. 
- I don't know how to detect monitor status without `xset q` on RPI. I need your help.

## Updated
### 2017-10-16
- Indonesian translations added (Thanks to @slametps)
- some bugs fixed.

### 2017-09-01
- Some bugs are fixed
- `/capture` command is added.
