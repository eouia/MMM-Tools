/* Magic Mirror
 * Node Helper: MMM-Tools
 *
 * By
 * MIT Licensed.
 */


var async = require('async')
var exec = require('child_process').exec
var request = require('request')
var moment = require('moment')
var myMath= {}
myMath.round = function(number, precision) {
    var factor = Math.pow(10, precision)
    var tempNumber = number * factor
    var roundedTempNumber = Math.round(tempNumber)
    return roundedTempNumber / factor
}

const scripts = {
  //onStart
  IP : "hostname -I",
  MEMORY_TOTAL : "free -h | grep Mem | awk '{print $2}'",
  STORAGE_TOTAL : "df -h --total | grep total | awk '{print $2}'",
  //onSchedule
  CPU_TEMPERATURE : "cat /sys/devices/virtual/thermal/thermal_zone0/temp",
  GPU_TEMPERATURE : "cat /sys/devices/virtual/thermal/thermal_zone1/temp",
  //@FIXME uptime format check!!!
  UPTIME : "cat /proc/uptime | awk '{print $1}'", //cat /proc/uptime
  CPU_USAGE : "grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'", //grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage "%"}'
  MEMORY_USED : "free -h | grep 'Mem:' | awk '{print $3}'",
  MEMORY_USED_PERCENT : "free | grep 'Mem:' | awk '{print $3/$2*100}'",
  STORAGE_USED : "du -h -s",
  STORAGE_USED_PERCENT : "df --total | grep 'total' | awk '{print $3/$2*100}'",
  //onDemand
  SCREEN_ON : "xset dpms force on",
  SCREEN_OFF : "xset dpms force off",
  SCREEN_STATUS : "xset q | grep 'Monitor is' | awk '{print $3}'",
  SCREEN_CAPTURE : "scrot screencapture.png"
}

const rpi_scripts = {
  CPU_TEMPERATURE : "cat /sys/class/thermal/thermal_zone0/temp",
  GPU_TEMPERATURE : "/opt/vc/bin/vcgencmd measure_temp", // frankly, I think these two in RPI are internally same...
  //Is it better to use tvservice???
  SCREEN_ON : "vcgencmd display_power 1",
  SCREEN_OFF : "vcgencmd display_power 0",
}

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start : function() {
    this.config = {}
    this.timer = null
    this.scripts = {}
    this.status = {
      IP : "Loading...",
      MEMORY_TOTAL : "0",
      STORAGE_TOTAL : "0",
      CPU_TEMPERATURE : "0.0",
      GPU_TEMPERATURE : "0.0",
      UPTIME : "00:00",
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
      this.scripts = scripts
      if (this.config.device == 'RPI') {
        this.scripts = Object.assign({}, this.scripts, rpi_scripts)
      }
      this.getIP()
      this.getMemoryTotal()
      this.getStorageTotal()
      this.scheduler()
    }
    if (notification == 'SCREEN_ON') {
      exec (this.scripts['SCREEN_ON'], (err, stdout, stderr)=>{})
    }
    if (notification == 'SCREEN_OFF') {
      exec (this.scripts['SCREEN_OFF'], (err, stdout, stderr)=>{})
    }
    if (notification == 'SCREEN_CAPTURE') {
      exec (this.scripts['SCREEN_CAPTURE'], (err, stdout, stderr)=>{
        if (!err) {
          this.sendSocketNotification('SCREEN_CAPTURED', payload)
        }
      })
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
    this.getCPUTemp()
    this.getGPUTemp()
    this.getUpTime()
    this.getCPUUsage()
    this.getMemoryUsed()
    this.getStorageUsed()
    this.getMemoryUsedPercent()
    this.getStorageUsedPercent()
    this.getScreen()
    this.sendSocketNotification('STATUS', this.status)
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
        if (this.config.device == 'RPI') {
          value = value.replace('temp=','').replace('\'C','')
        } else {
          value = myMath.round((value / 1000), 1)
        }
        this.status['GPU_TEMPERATURE'] = value
      }
    })
  },

  getUpTime : function() {
    exec (this.scripts['UPTIME'], (err, stdout, stderr)=>{
      if (err == null) {
        var value = myMath.round(stdout.trim().replace(",", ""), 1)
        var mv = moment.duration(value, 'seconds').humanize()
        this.status['UPTIME'] = mv
      }
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
