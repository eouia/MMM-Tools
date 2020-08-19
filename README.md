# MMM-Tools
Display stats and remote controlling MagicMirror on SBC(ATB &amp; RPI), MMM-TelegramBot supported.

## Screenshots
![](https://github.com/bugsounet/MMM-Tools/blob/dev/capture/capture3.png)

on `MagicMirror`

![](https://github.com/bugsounet/MMM-Tools/blob/dev/capture/capture4.png)

on `Telegram`

## Feature
- Display system status on `MagicMirror`
- `MMM-TelegramBot` command: `/status`

## news Updates v2

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

### Detailed Configuration Field
|field | default | description
|--- |--- |---
|refresh | `5000` | Milliseconds for refreshing status information on `MagicMirror`
|containerSize | `null` | Force to define the container size in px. With `null` it's automaticaly calculated
|itemSize| `null` | Force to define the item size in px. With `null` it's automaticaly calculated

### Field `OS: {}`
|field | default | description
|--- |--- |---
|displayOs| true | Display the name of the OS
|orderOs| 1 | Number of order in the array

### Field `CPU: {}`
|field | default | description
|--- |--- |---
|displayUsage| true | Display usage of the CPU in %
|orderUsage| 4 | Order number in the array for displaying CPU usage
|displayTemp| true | Display temperature of the CPU
|orderTemp| 7 | Order number in the array for displaying CPU Temp.
|displayType| true | Display type of the RPI or CPU
|orderType| 2 | Order number in the array for displaying CPU/RPI Type

### Field `RAM: {}`
|field | default | description
|--- |--- |---
|displayRam| true | Display RAM usage
|orderRam| 5 | Order number in the array for RAM usage

### Field `STORAGE: {}`
|field | default | description
|--- |--- |---
|displayStorage| true | Display storage informations
|orderStorage| 6 | Order number in the array for storage informations
|partitionExclude| [] | Exclude some partition informations

Samples:

`PartitionExclude: [ "/boot" ]`

`PartitionExclude: [ "/boot", "/media/Data" ]`

### Field `NETWORK: {}`
|field | default | description
|--- |--- |---
|displayNetwork| true | Display network informations
|orderNetwork| 3 | Order number in the array for network informations
|nativeNetwork| false | If you activate this feature, the real name of the interface will be displayed 
|displayDefaultNetwork| true | Localize the default network with a `*`

### Field `UPTIME: {}`
|field | default | description
|--- |--- |---
|displayUptime| true | Display uptime informations (since boot)
|orderUptime| 8 | Order number in the array for uptime informations
|displayRecord| true | Display record uptime informations
|orderRecord| 9 | Order number in the array for record uptime informations

## Commands (For `MMM-TelegramBot`)
|command | description
|--- |---
|`/status` | Show system status

## updating V1 to V2
```
cd ~/MagicMirror/modules/MMM-Tools
git pull
npm install
```
replace your old configuration to the new default configuration and personalize it

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
