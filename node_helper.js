/* Magic Mirror
 * Node Helper: MMM-Tools
 *
 * By
 * MIT Licensed.
 */


var async = require('async')
var exec = require('child_process').exec
var os = require('os')
const path = require("path")
const fs = require("fs")

var myMath= {}
myMath.round = function(number, precision) {
    var factor = Math.pow(10, precision)
    var tempNumber = number * factor
    var roundedTempNumber = Math.round(tempNumber)
    return roundedTempNumber / factor
}

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start : function() {
    this.config = {}
    this.timer = null
    this.recordInit = true
    this.record = 0
    this.scripts = {
      OS_DIST : "cat /etc/*release |grep ^ID= |cut -f2 -d=",
      OS_VERSION : "cat /etc/*release |grep ^VERSION_ID= |cut -f2 -d= | tr -d '\"'",
      OS_NAME : "cat /etc/*release |grep ^VERSION_CODENAME= |cut -f2 -d=",
      IP : "hostname -I",
      MEMORY_TOTAL : "head -5 /proc/meminfo  | awk '{print}' ORS=' ' | awk '{print ($2)/1024}' | cut -f1 -d\".\" | sed 's/$/Mb/'",
      STORAGE_TOTAL : "df -h | grep /$ | awk '{print}' ORS=' ' | awk '{print $2}'",
      CPU_TEMPERATURE : "cat /sys/devices/virtual/thermal/thermal_zone0/temp",
      GPU_TEMPERATURE : "cat /sys/devices/virtual/thermal/thermal_zone1/temp",
      CPU_USAGE : "top -bn 2 | grep Cpu | awk '{print $8}' | awk '{print}' ORS=' ' | awk '{print 100-$2}'", // A bit slower to get result but more accurate , actually reflecting what the task manager shows.
      MEMORY_USED : "head -5 /proc/meminfo  | awk '{print}' ORS=' ' | awk '{print (($2-$5)-($11+$14))/1024}' | cut -f1 -d\".\" | sed 's/$/Mb/'",
      MEMORY_USED_PERCENT : "head -5 /proc/meminfo  | awk '{print}' ORS=' ' | awk '{print (($2-$5)-($11+$14))/$2*100}'",
      STORAGE_USED : "df -h | grep /$ | awk '{print}' ORS=' ' | awk '{print $3}'",
      STORAGE_USED_PERCENT : "df -h | grep /$ | awk '{print}' ORS=' ' | awk '{print $3/$2*100}'",
      SCREEN_ON : "xset dpms force on",
      SCREEN_OFF : "xset dpms force off",
      SCREEN_STATUS : "xset q | grep 'Monitor is' | awk '{print $3}'",
    }

    this.status = {
      OS: "Loading...",
      IP : "Loading...",
      MEMORY_TOTAL : "0",
      STORAGE_TOTAL : "0",
      CPU_TEMPERATURE : "0.0",
      GPU_TEMPERATURE : "0.0",
      UPTIME : "Loading...",
      RECORD : "Loading...",
      CPU_USAGE : "0.00",
      MEMORY_USED : "0",
      MEMORY_USED_PERCENT : "0",
      STORAGE_USED : "0",
      STORAGE_USED_PERCENT : "0",
      SCREEN_STATUS : "Loading...",
    }
    this.sendSocketNotification('STATUS', this.status)
  },

  socketNotificationReceived : function(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload
      if (this.config.recordUptime) this.getRecordUptime()
      if (this.config.device == 'RPI') {
        this.rpi_scripts = {
          CPU_TEMPERATURE : "cat /sys/class/thermal/thermal_zone0/temp",
          SCREEN_ON : "vcgencmd display_power 1",
          SCREEN_OFF : "vcgencmd display_power 0",
          SCREEN_STATUS : "vcgencmd display_power | grep  -q 'display_power=1' && echo 'ON' || echo 'OFF'",
        }
        this.scripts = Object.assign({}, this.scripts, this.rpi_scripts)
      }
      this.getIP()
      this.getMemoryTotal()
      this.getStorageTotal()
      this.scheduler()
      this.getOS_DIST()
      this.getOS_VERSION()
      this.getOS_NAME()
    }
    if (notification == 'SCREEN_ON') {
      exec (this.scripts['SCREEN_ON'], (err, stdout, stderr)=>{})
    }
    if (notification == 'SCREEN_OFF') {
      exec (this.scripts['SCREEN_OFF'], (err, stdout, stderr)=>{})
    }
  },

  scheduler : function() {
    this.timer = null
    this.monitor()
    timer = setTimeout(()=>{
      this.scheduler()
    }, this.config.refresh_interval_ms)
  },

  monitor : function() {
    this.getOS()
    this.getCPUTemp()
    if (this.config.device != "RPI") this.getGPUTemp()
    this.getUpTime()
    this.getCPUUsage()
    this.getMemoryUsed()
    this.getStorageUsed()
    this.getMemoryUsedPercent()
    this.getStorageUsedPercent()
    this.getScreen()
    this.sendSocketNotification('STATUS', this.status)
  },

  getOS_DIST : function() {
    exec (this.scripts['OS_DIST'], (err, stdout, stderr)=>{
      if (err == null) {
        this.OS_DIST = stdout.trim()
      }
    })
  },

  getOS_VERSION : function() {
    exec (this.scripts['OS_VERSION'], (err, stdout, stderr)=>{
      if (err == null) {
        this.OS_VERSION = stdout.trim()
      }
    })
  },

  getOS_NAME : function() {
    exec (this.scripts['OS_NAME'], (err, stdout, stderr)=>{
      if (err == null) {
        this.OS_NAME = stdout.trim()
      }
    })
  },

  getOS : function() {
    if (!this.OS_DIST || !this.OS_VERSION || !this.OS_NAME) return this.status['OS'] = "Unknow"
    this.status['OS'] = this.OS_DIST + " " + this.OS_VERSION + " (" + this.OS_NAME + ")"
  },

  getIP : function() {
    exec (this.scripts['IP'], (err, stdout, stderr)=>{
      if (err == null) {
        var matched = stdout.trim().match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)
        this.status['IP'] = (matched) ? matched[0] : "Unknown"
      }
    })
  },

  getMemoryTotal : function() {
    exec (this.scripts['MEMORY_TOTAL'], (err, stdout, stderr)=>{
      if (err == null) {
        var value = parseInt(stdout.trim())
        this.status['MEMORY_TOTAL'] = stdout.trim()
      }
    })
  },

  getStorageTotal : function() {
    exec (this.scripts['STORAGE_TOTAL'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['STORAGE_TOTAL'] = stdout.trim()
      }
    })
  },

  getCPUTemp : function() {
    exec (this.scripts['CPU_TEMPERATURE'], (err, stdout, stderr)=>{
      if (err == null) {
        var value = stdout.trim()
        value = myMath.round((value / 1000), 1)
        this.status['CPU_TEMPERATURE'] = value
      }
    })
  },

  getGPUTemp : function() {
    exec (this.scripts['GPU_TEMPERATURE'], (err, stdout, stderr)=>{
      if (err == null) {
        var value = stdout.trim()
        value = myMath.round((value / 1000), 1)
        this.status['GPU_TEMPERATURE'] = value
      }
    })
  },

  getUpTime : function() {
    var uptime = os.uptime()
    var uptimeDHM = this.getDHM(uptime)
    if (this.config.recordUptime) {
      if (!this.recordInit && (uptime > this.record)) {
        this.record = uptime
        this.sendRecordUptime(this.record)
      }
      var recordDHM = this.getDHM(this.record)
      this.status['RECORD'] = recordDHM
    }
    this.status['UPTIME'] = uptimeDHM
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
     if (days >1) days = days + " " + this.config.uptime.day + this.config.uptime.plurial + " "
      else days = days + " " + this.config.uptime.day + " "
    }
    else days = ""
    if (hours > 0) {
     if (hours > 1) hours = hours + " " + this.config.uptime.hour + this.config.uptime.plurial + " "
      else hours = hours + " " + this.config.uptime.hour + " "
    }
    else hours = ""
    if (minutes > 1) minutes = minutes + " " + this.config.uptime.minute + this.config.uptime.plurial
    else minutes = minutes + " " + this.config.uptime.minute
    return days + hours + minutes
  },

  /** get lastuptime saved **/
  getRecordUptime : function() {
    var uptimeFilePath = path.resolve(__dirname, "uptime")
    if (fs.existsSync(uptimeFilePath)) {
      var readFile = fs.readFile(uptimeFilePath, 'utf8',  (error, data) => {
        if (error) return console.log("readFile uptime error!", error)
        this.record = data
        this.recordInit= false
      })
    } else {
      var recordFile = fs.writeFile(uptimeFilePath, 1, (error) => {
        if (error) return console.log("recordFile creation error!", error)
        this.record = 1
        this.recordInit= false
      })
    }
  },

  /** save uptime **/
  sendRecordUptime : function (uptime) {
    var uptimeFilePath = path.resolve(__dirname, "uptime")
    var recordNewFile = fs.writeFile(uptimeFilePath, uptime, (error) => {
      if (error) return console.log("recordFile creation error!", error)
    })
  },

  getCPUUsage : function() {
    exec (this.scripts['CPU_USAGE'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['CPU_USAGE'] = myMath.round(stdout.trim(), 2)
      }
    })
  },

  getMemoryUsed : function() {
    exec (this.scripts['MEMORY_USED'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['MEMORY_USED'] = stdout.trim().replace(",", "")
      }
    })
  },

  getStorageUsed : function() {
    exec (this.scripts['STORAGE_USED'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['STORAGE_USED'] = stdout.trim()
      }
    })
  },

  getMemoryUsedPercent : function() {
    exec (this.scripts['MEMORY_USED_PERCENT'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['MEMORY_USED_PERCENT']
          = myMath.round(stdout.trim(), 1)
      }
    })
  },

  getStorageUsedPercent : function() {
    exec (this.scripts['STORAGE_USED_PERCENT'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['STORAGE_USED_PERCENT']
          = myMath.round(parseInt(stdout.trim()), 1)
      }
    })
  },

  getScreen : function() {
    exec (this.scripts['SCREEN_STATUS'], (err, stdout, stderr)=>{
      if (err == null) {
        this.status['SCREEN_STATUS'] = stdout.trim()
      }
    })
  }
});
