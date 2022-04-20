/* Magic Mirror
 * Node Helper: MMM-Tools v2
 * @bugsounet
 */

var async = require('async')
var exec = require('child_process').exec
var os = require('os')
const path = require("path")
const fs = require("fs")
const si = require('systeminformation')
const isPi = require('detect-rpi')

var NodeHelper = require("node_helper")

var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start : function() {
    this.config = {}
    this.timer = null
    this.recordInit = true
    this.record = 0
    this.first = true

    this.status = {
      MM: "v" + require('../../package.json').version,
      OS: "Loading...",
      NETWORK: [],
      MEMORY: {},
      STORAGE: [],
      NODE: "unknow",
      NPM: "unknow",
      CPU: {
        usage: 0,
        type: "unknow",
        temp: {
          C: 0,
          F: 0
        },
        speed: "unknow",
        governor: "unknow"
      },
      UPTIME : "Loading...",
      RECORD : "Loading..."
    }
    console.log("[Tools] MMM-Tools Version:", require('./package.json').version)
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload
      if (this.config.debug) log = (...args) => { console.log("[Tools]", ...args) }
      this.startScan()
    }
  },

  startScan: async function() {
    if (this.config.UPTIME.displayRecord) await this.getRecordUptime()
    await this.getNode()
    await this.getNpm()
    await this.getOS()
    await this.getSys()
    this.scheduler()
  },

  scheduler: async function() {
    /** Launch main loop **/
    this.timer = null
    clearTimeout(this.timer)
    await this.monitor(resolve => {this.sendSocketNotification('STATUS', this.status)})
    log("Send this Status:", this.status)
    if (this.first && !this.config.containerSize && !this.config.itemSize) {
      this.sendSocketNotification('STATUS', this.status)
      log("Send again Status...")
    }
    this.first = false
    timer = setTimeout(()=>{
      this.scheduler()
    }, this.config.refresh)
  },

  monitor: async function(resolve) {
    await this.getCPUTemp()
    await this.getCPULoad()
    await this.getCPUSpeedGovernor()
    await this.getIP()
    await this.getUpTime()
    await this.getMemory()
    await this.getStorage()
    resolve()
  },

  getNode : function() {
    return new Promise((resolve) => {
      exec ("node -v", (err, stdout, stderr)=>{
        if (err == null) this.status['NODE'] = stdout.trim()
        resolve()
      })
    })
  },

  getNpm : function() {
    return new Promise((resolve) => {
      exec ("npm -v", (err, stdout, stderr)=>{
        if (err == null) this.status['NPM'] = "v"+stdout.trim()
        resolve()
      })
    })
  },

  getOS: function() {
    return new Promise((resolve) => {
      si.osInfo()
        .then(data => {
          this.status['OS'] = data.distro.split(' ')[0] + " " + data.release + " (" + data.codename + (this.config.OS.displayArch ? " " + data.arch + ")" : ")")
          resolve()
        })
        .catch(error => {
          log("Error osInfo!")
          this.status['OS'] = "unknow"
          resolve()
        })
    })
  },

  getSys: function () {
    return new Promise((resolve) => {
      if (isPi()) {
        si.system()
          .then(data => {
            this.status['CPU'].type = "Raspberry Pi " + data.raspberry.type
            resolve()
          })
          .catch(error => {
            log("Error in cpu Type!")
            this.status['CPU'].type = "unknow"
            resolve()
          })
      } else {
        si.cpu()
          .then(data => {
            this.status['CPU'].type = data.manufacturer + " " + data.brand
            resolve()
          })
          .catch(error => {
            log("Error in cpu Type!")
            this.status['CPU'].type = "unknow"
            resolve()
          })
      }
    })
  },

  getIP: function() {
    return new Promise((resolve) => {
      si.networkInterfaceDefault()
        .then(defaultInt=> {
          this.status['NETWORK'] = []
          si.networkInterfaces().then(data => {
            var int =0
            data.forEach(interface => {
              var info = {}
              if (interface.type == "wireless") {
                info["WLAN"] = {
                  ip: interface.ip4 ? interface.ip4 : "unknow",
                  name: interface.iface ? interface.iface: "unknow",
                  default: (interface.iface == defaultInt) ? true: false
                }
              }
              if (interface.type == "wired") {
                info["LAN"] = {
                  ip: interface.ip4 ? interface.ip4 : "unknow",
                  name: interface.iface ? interface.iface: "unknow",
                  default: (interface.iface == defaultInt) ? true: false
                }
              }
              if (interface.iface != "lo") this.status['NETWORK'].push(info)
              if (int == data.length-1) resolve()
              else int +=1
            })
          })
        })
        .catch(error => {
          var info = {}
          log("Error in Network!")
          info["LAN"] = {
            ip: "unknow",
            name: "unknow",
            default: false
          }
          this.status['NETWORK'].push(info)
          resolve()
        })
    })
  },

  getCPUTemp: function() {
    return new Promise((resolve) => {
      si.cpuTemperature()
        .then(data => {
          let tempC = data.main
          let tempF = (tempC * (9 / 5)) + 32
          this.status['CPU'].temp.F = tempF.toFixed(1)
          this.status['CPU'].temp.C = tempC.toFixed(1)
          resolve()
        })
        .catch(error => {
          log("Error cpu Temp!")
          this.status['CPU'].temp.F = 0
          this.status['CPU'].temp.C = 0
          resolve()
        })
    })
  },

  getCPULoad: function() {
    return new Promise((resolve) => {
      si.currentLoad()
        .then(data => {
          this.status['CPU'].usage= data.currentLoad.toFixed(0)
          resolve()
        })
        .catch(error => {
          log("Error in cpu Usage!")
          this.status['CPU'].usage= 0
          resolve()
        })
    })
  },

  getCPUSpeedGovernor: function() {
    return new Promise((resolve) => {
      si.cpu()
        .then(data => {
          this.status['CPU'].speed= data.speed + " Ghz"
          this.status['CPU'].governor= data.governor
          resolve()
        })
        .catch(error => {
          log("Error in cpu Speed / Governor!")
          this.status['CPU'].speed= "unknow"
          this.status['CPU'].governor= "unknow"
          resolve()
        })
    })
  },

  getMemory: function() {
    return new Promise((resolve) => {
      si.mem()
        .then(data => {
          this.status['MEMORY'].total = this.convert(data.total,0)
          this.status['MEMORY'].used = this.convert(data.used-data.buffcache,2)
          this.status['MEMORY'].percent = ((data.used-data.buffcache)/data.total*100).toFixed(0)
          resolve()
        })
        .catch(error => {
          log("Error in Memory!")
          this.status['MEMORY'].total = 0
          this.status['MEMORY'].used = 0
          this.status['MEMORY'].percent = 0
          resolve()
        })
    })
  },

  getStorage: function() {
    return new Promise((resolve) => {
      si.fsSize()
        .then(data => {
          this.status['STORAGE']= []
          var number = 0
          data.forEach(partition => {
            var info = {}
            var part = partition.mount
            info[part] = {
              "size": this.convert(partition.size,0),
              "used": this.convert(partition.used,2),
              "use": partition.use,
            }
            this.status['STORAGE'].push(info)
            if (number == data.length-1) resolve()
            else number += 1
          })
        })
        .catch(error => {
          log("Error in Storage!")
          var info = {}
          info["unknow"] = {
            "size": 0,
            "used": 0,
            "use": 0,
          }
          this.status['STORAGE'].push(info)
          resolve()
        })
    })
  },

/** **/
  convert: function(octet,FixTo) {
    octet = Math.abs(parseInt(octet, 10));
    var def = [[1, 'b'], [1024, 'Kb'], [1024*1024, 'Mb'], [1024*1024*1024, 'Gb'], [1024*1024*1024*1024, 'Tb']];
    for(var i=0; i<def.length; i++){
      if(octet<def[i][0]) return (octet/def[i-1][0]).toFixed(FixTo)+def[i-1][1];
    }
  },

  getUpTime: function() {
    return new Promise((resolve) => {
      var uptime = this.config.UPTIME.useMagicMirror ? Math.floor(process.uptime()) : os.uptime()
      var uptimeDHM = this.getDHM(uptime)
      if (this.config.UPTIME.displayRecord) {
        if (!this.recordInit && (uptime > this.record)) {
          this.record = uptime
          this.sendRecordUptime(this.record)
        }
        var recordDHM = this.getDHM(this.record)
        this.status['RECORD'] = recordDHM
      }
      this.status['UPTIME'] = uptimeDHM
      resolve()
    })
  },

  /** return days, minutes, secondes **/
  getDHM: function (seconds) {
    if (seconds == 0) return "Loading..."
    var days = Math.floor(seconds / 86400);
    seconds = seconds - (days*86400);
    var hours = Math.floor(seconds / 3600);
    seconds = seconds - (hours*3600);
    var minutes = Math.floor(seconds / 60)
    if (days > 0) {
     if (days >1) days = days + " " + this.config.uptime.days + " "
      else days = days + " " + this.config.uptime.day + " "
    }
    else days = ""
    if (hours > 0) {
     if (hours > 1) hours = hours + " " + this.config.uptime.hours + " "
      else hours = hours + " " + this.config.uptime.hour + " "
    }
    else hours = ""
    if (minutes > 1) minutes = minutes + " " + this.config.uptime.minutes
    else minutes = minutes + " " + this.config.uptime.minute
    return days + hours + minutes
  },

  /** get lastuptime saved **/
  getRecordUptime: function() {
    return new Promise((resolve) => {
      var uptimeFilePath = this.config.UPTIME.useMagicMirror ? path.resolve(__dirname, "MMuptime") : path.resolve(__dirname, "uptime")
      if (fs.existsSync(uptimeFilePath)) {
        var readFile = fs.readFile(uptimeFilePath, 'utf8',  (error, data) => {
          if (error) {
            log("readFile uptime error!", error)
            return resolve()
          }
          this.record = data
          this.recordInit= false
          resolve()
        })
      } else {
        var recordFile = fs.writeFile(uptimeFilePath, "1", (error) => {
          if (error) {
            log("recordFile creation error!", error)
            return resolve()
          }
          this.record = 1
          this.recordInit= false
          resolve()
        })
      }
    })
  },

  /** save uptime **/
  sendRecordUptime: function (uptime) {
    var uptimeFilePath = this.config.UPTIME.useMagicMirror ? path.resolve(__dirname, "MMuptime") : path.resolve(__dirname, "uptime")
    var recordNewFile = fs.writeFile(uptimeFilePath, uptime.toString(), (error) => {
      if (error) return log("recordFile writing error!", error)
    })
  }
});
