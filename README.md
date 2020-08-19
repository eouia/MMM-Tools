# MMM-Tools
Display stats and remote controlling MagicMirror on SBC(ATB &amp; RPI), MMM-TelegramBot supported.

## Screenshots
![](https://github.com/bugsounet/MMM-Tools/blob/master/capture/capture2.jpg)

on `MagicMirror`

![](https://github.com/bugsounet/MMM-Tools/blob/master/capture/capture1.jpg)

on `Telegram`

## Feature
- Display system status on `MagicMirror`
- `MMM-TelegramBot` commands, `/status`

## new Updates v2

### v2.0.0 :
- refact all core code
- initial Release

## Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/bugsounet/MMM-Tools
```

## Configuration
```javascript
{
  module: 'MMM-Tools',
  position: 'bottom_right',
  config: {
    refresh: 1000 * 5,
    containerSize: null,
    itemSize: null,
    OS: {
      displayOs: true,
      orderOs: 1
    },
    CPU: {
      displayUsage: true,
      orderUsage: 4,
      displayTemp: true,
      orderTemp: 7,
      displayType: true,
      orderType: 2
    },
    RAM: {
      displayRam: true,
      orderRam: 5
    },
    STORAGE: {
      displayStorage: true,
      orderStorage: 6,
      partitionExclude : []
    },
    NETWORK: {
      displayNetwork: true,
      orderNetwork: 3,
      nativeNetwork: false,
      displayDefaultNetwork: true
    },
    UPTIME: {
      displayUptime: true,
      orderUptime: 8,
      displayRecord: true,
      orderRecord: 9
    }
  }
}
```

### Detailed Configuration
|field | default | description
|--- |--- |---
|refresh | `5000` | Milliseconds for refreshing status information on `MagicMirror`

## Commands (For `MMM-TelegramBot`)
|command | description
|--- |---
|`/status` | Show system status

## Old Updates

### v1.1.4 : 2020-07-11
- Fix OS Display
- Del other SBC then RPI

### v1.1.3 : 2020-07-07
- Add record Uptime info (optional)
- Del AssistantSay feature (deprecied)

### v1.1.2 : 2020-07-06
- Add OS info
- Fix uptime

### v1.1.1 : 2020-05-23
- change uptime script for RPI

### v1.1.0 : 2020-05-12
- owner change
- move warning_text to translate files
- delete capture function (already in TelegramBot core)
- delete GPU info of rpi (same of cpu)
- add assistantSay feature (need myMagicWord feature of MMM-AssistantMk2)
