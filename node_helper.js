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
const si = require('systeminformation')

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
      IP : "hostname -I",
      STORAGE_TOTAL : "df -h | grep /$ | awk '{print}' ORS=' ' | awk '{print $2}'",
      STORAGE_USED : "df -h | grep /$ | awk '{print}' ORS=' ' | awk '{print $3}'",
      STORAGE_USED_PERCENT : "df -h | grep /$ | awk '{print}' ORS=' ' | awk '{print $3/$2*100}'",
      SCREEN_ON : "vcgencmd display_power 1",
      SCREEN_OFF : "vcgencmd display_power 0",
      SCREEN_STATUS : "vcgencmd display_power | grep  -q 'display_power=1' && echo 'ON' || echo 'OFF'"
    }

    this.status = {
      OS: "Loading...",
      IP : "Loading...",
      MEMORY_TOTAL : "0",
      STORAGE_TOTAL : "0",
      CPU_TEMPERATURE : "0.0",
      UPTIME : "Loading...",
      RECORD : "Loading...",
      CPU_USAGE : "0",
      MEMORY_USED : "0",
      MEMORY_USED_PERCENT : "0",
      STORAGE_USED : "0",
      STORAGE_USED_PERCENT : "0",
      SCREEN_STATUS : "Loading...",
    }
    this.sendSocketNotification('STATUS', this.status)
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload
      this.startScan()
    }
    if (notification == 'SCREEN_ON') {
      exec (this.scripts['SCREEN_ON'], (err, stdout, stderr)=>{})
    }
    if (notification == 'SCREEN_OFF') {
      exec (this.scripts['SCREEN_OFF'], (err, stdout, stderr)=>{})
    }
  },

  startScan: async function() {
    if (this.config.recordUptime) await this.getRecordUptime()
    await this.getOS()
    await this.getStorageTotal()
    /** Launch main loop **/
    this.scheduler()
  },

  scheduler: async function() {
    this.timer = null
    await this.monitor(resolve => { this.sendSocketNotification('STATUS', this.status) })
    console.log("Send this Status:", this.status)
    timer = setTimeout(()=>{
      this.scheduler()
    }, this.config.refresh_interval_ms)
  },

  monitor: async function(resolve) {
    await this.getCPUTemp()
    await this.getIP()
    await this.getUpTime()
    await this.getCPUUsage()
    await this.getMemoryUsed()
    await this.getStorageUsed()
    await this.getStorageUsedPercent()
    await this.getScreen()
    resolve()
  },

  getOS: function() {
    return new Promise((resolve) => {
      si.osInfo().then(data => {
        this.status['OS'] = data.distro.split(' ')[0] + " " + data.release + " (" + data.codename+ ")" 
        console.log("OS:", data.distro.split(' ')[0] + " " + data.release + " (" + data.codename+ ")" )
        resolve()
      })
    })
  },

  getIP: function() {
    return new Promise((resolve) => {
      exec (this.scripts['IP'], (err, stdout, stderr)=>{
        if (err == null) {
          var matched = stdout.trim().match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)
          this.status['IP'] = (matched) ? matched[0] : "Unknown"
          resolve()
        }
      })
      //si.networkInterfaces().then(data => console.log(data))
    })
  },

  getStorageTotal: function() {
    return new Promise((resolve) => {
      exec (this.scripts['STORAGE_TOTAL'], (err, stdout, stderr)=>{
        if (err == null) {
          this.status['STORAGE_TOTAL'] = stdout.trim()
          resolve()
        }
      })
    })
  },

  getCPUTemp: function() {
    return new Promise((resolve) => {
      si.cpuTemperature().then(data => {
        console.log("CPU Temp:", data.main)
        this.status['CPU_TEMPERATURE'] = data.main
        resolve()
      })
    })
  },

  getUpTime: function() {
    return new Promise((resolve) => {
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
  getRecordUptime: function() {
    return new Promise((resolve) => {
      var uptimeFilePath = path.resolve(__dirname, "uptime")
      if (fs.existsSync(uptimeFilePath)) {
        var readFile = fs.readFile(uptimeFilePath, 'utf8',  (error, data) => {
          if (error) {
            console.log("readFile uptime error!", error)
            return revolve()
          }
          this.record = data
          this.recordInit= false
          resolve()
        })
      } else {
        var recordFile = fs.writeFile(uptimeFilePath, 1, (error) => {
          if (error) {
            console.log("recordFile creation error!", error)
            return revolve()
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
    var uptimeFilePath = path.resolve(__dirname, "uptime")
    var recordNewFile = fs.writeFile(uptimeFilePath, uptime, (error) => {
      if (error) return console.log("recordFile creation error!", error)
    })
  },

  getCPUUsage: function() {
    return new Promise((resolve) => {
      si.currentLoad().then(data => {
        this.status['CPU_USAGE'] = data.currentload.toFixed(0)
        console.log("CPU Usage", data.currentload.toFixed(0))
        resolve()
      })
    })
  },

  getMemoryUsed: function() {
    return new Promise((resolve) => {
      si.mem().then(data => {
        this.status['MEMORY_TOTAL'] = (data.total/1024/1024).toFixed(0) + "Mb"
        console.log("Mem Total", (data.total/1024/1024).toFixed(0))
        this.status['MEMORY_USED'] = (((data.total-data.free)-(data.buffers+data.cached))/1024/1024).toFixed(0) + "Mb"
        console.log("Mem used", (((data.total-data.free)-(data.buffers+data.cached))/1024/1024).toFixed(0))
        this.status['MEMORY_USED_PERCENT'] = (((data.total-data.free)-(data.buffers+data.cached))/data.total*100).toFixed(0)
        console.log("Mem %", (((data.total-data.free)-(data.buffers+data.cached))/data.total*100).toFixed(0))
        resolve()
      })
    })
  },

  getStorageUsed: function() {
    return new Promise((resolve) => {
      exec (this.scripts['STORAGE_USED'], (err, stdout, stderr)=>{
        if (err == null) {
          this.status['STORAGE_USED'] = stdout.trim()
          resolve()
        }
        else resolve()
      })
    })
  },

  getStorageUsedPercent: function() {
    return new Promise((resolve) => {
      exec (this.scripts['STORAGE_USED_PERCENT'], (err, stdout, stderr)=>{
        if (err == null) {
          this.status['STORAGE_USED_PERCENT'] = myMath.round(parseInt(stdout.trim()), 1)
          resolve()
        }
      })
    })
    //si.fsSize().then(data => console.log(data))
  },

  getScreen: function() {
    return new Promise((resolve) => {
      exec (this.scripts['SCREEN_STATUS'], (err, stdout, stderr)=>{
        if (err == null) {
          this.status['SCREEN_STATUS'] = stdout.trim()
          resolve()
        }
      })
    })
  }
});
