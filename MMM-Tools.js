/* global Module */

/* Magic Mirror
 * Module: MMM-Tools
 *
 * By
 * MIT Licensed.
 */
 var myMath= {}

 myMath.round = function(number, precision) {
     var factor = Math.pow(10, precision)
     var tempNumber = number * factor
     var roundedTempNumber = Math.round(tempNumber)
     return roundedTempNumber / factor
 }

Module.register("MMM-Tools", {
  defaults: {
    device : "ATB", // "RPI" is also available
    refresh_interval_ms : 10000,
    warning_interval_ms : 1000 * 60 * 5,
    enable_warning : true,
    warning : {
      CPU_TEMPERATURE : 65,
      GPU_TEMPERATURE : 65,
      CPU_USAGE : 75,
      STORAGE_USED_PERCENT : 80,
      MEMORY_USED_PERCENT : 80,
    },
  },
  /* Remove unnecessary requiresVersion
  requiresVersion: "2.1.2", // Required version of MagicMirror
  */
  start: function() {
    this.status = {
      IP : "",
      MEMORY_TOTAL : "",
      STORAGE_TOTAL : "",
      CPU_TEMPERATURE : "",
      GPU_TEMPERATURE : "",
      UPTIME : "",
      CPU_USAGE : "",
      MEMORY_USED : "",
      MEMORY_USED_PERCENT : 0,
      STORAGE_USED : "",
      SOTRAGE_USED_PERCENT : 0,
      SCREEN_STATUS : "",
    }
    this.warningRecord = {}
    this.sendSocketNotification('CONFIG', this.config)
  },

  getCommands : function(register) {
    if (register) {
      register.add({
        command: 'status',
        description: 'Show system status.',
        callback: 'cmd_status'
      })
      register.add({
        command: 'screen',
        description: 'Turn monitor on/off. `/screen on` or `/screen off`',
        callback: 'cmd_screen',
        args_pattern : [/^on|off/i],
        args_mapping : ['onoff']
      })
    }
  },

  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "Tools"
    wrapper.appendChild(this.getDomIP())
    wrapper.appendChild(this.getDomMemory())
    wrapper.appendChild(this.getDomStorage())
    wrapper.appendChild(this.getDomCPUTemp())
    wrapper.appendChild(this.getDomGPUTemp())
    wrapper.appendChild(this.getDomUptime())
    wrapper.appendChild(this.getDomCPUUsage())
    return wrapper
  },

  getStyles: function () {
    return [
      "MMM-Tools.css",
    ]
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    if(notification === "STATUS") {
      this.status = payload
      this.checkWarning()
      this.updateDom()
    }
  },

  checkWarning : function() {
    if (this.config.enable_warning) {
      if (this.config.warning) {
        for (var name in this.config.warning) {
          var chk = this.config.warning[name]
          if (this.status[name]) {
            if (chk < parseFloat(this.status[name])) {
              //warning!!
              var now = Date.now()
              var record = (this.warningRecord[name]) ? this.warningRecord[name] : 0
              if (record + this.config.warning_interval_ms < now) {
                this.warningRecord[name] = now
                this.sendNotification(
                  "TOOLS_WARNING",
                  {
                    timestamp : now,
                    type : name,
                    condition : chk,
                    value : this.status['name']
                  }
                )
                var text = "*[WARNING] " + name + "* : `" + this.status[name] + "`"
                this.sendNotification("TELBOT_TELL_ADMIN", text)
              }

            } else {
              // do nothing
            }
          } else {
            // do nothing
          }
        }
      } else {
        // do nothing
      }
    } else {
      // do nothing
    }
  },

  cmd_status : function (command, handler) {
    var text = ""
    text += "*IP :* `" + this.status['IP'] + "`\n"
    text += "*RAM Used :* `" + this.status['MEMORY_USED_PERCENT'] + "%`\n"
    text += "*SD Used :* `" + this.status['STORAGE_USED_PERCENT'] + "%`\n"
    text += "*CPU Temp. :* `" + this.status['CPU_TEMPERATURE'] + "\°C`\n"
    text += "*GPU Temp.:* `" + this.status['GPU_TEMPERATURE'] + "\°C`\n"
    text += "*Uptime :* `" + this.status['UPTIME'] + "`\n"
    text += "*CPU Usage :* `" + this.status['CPU_USAGE'] + "%`\n"
    text += "*Display :* `" + this.status['SCREEN_STATUS'] + "`\n"
    handler.reply('TEXT', text, {parse_mode:'Markdown'})
  },

  cmd_screen : function (command, handler) {
    if (!handler.args) {
      handler.reply(
        'TEXT',
        "Invalid arguments.\nTry `/screen on` or `/screen off`",
        {parse_mode:'Markdown'}
      )
    } else {
      if (handler.args['onoff'].toLowerCase() == 'on') {
        handler.reply('TEXT', 'Display will be turned on now.')
        this.sendSocketNotification('SCREEN_ON')
      }
      if (handler.args['onoff'].toLowerCase() == 'off') {
        handler.reply('TEXT', 'Display will be turned off now.')
        this.sendSocketNotification('SCREEN_OFF')
      }
    }
  },

  getDomIP : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_ip"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "IP"
    var container = document.createElement("div")
    container.className = "container"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['IP']
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomMemory : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_memory"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "RAM"
    var container = document.createElement("div")
    container.className = "container"
    var total = document.createElement("div")
    total.className = "total"
    total.innerHTML = this.status["MEMORY_TOTAL"]
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = Math.round(this.status["MEMORY_USED_PERCENT"]) + "%"
    var step = myMath.round(this.status["MEMORY_USED_PERCENT"], -1)
    if (step > 100) step = 100
    used.className += " step" + step
    used.innerHTML = this.status["MEMORY_USED"]
    total.appendChild(used)
    container.appendChild(total)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomStorage : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_storage"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "SD"
    var container = document.createElement("div")
    container.className = "container"
    var total = document.createElement("div")
    total.className = "total"
    total.innerHTML = this.status["STORAGE_TOTAL"]
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = Math.round(this.status["STORAGE_USED_PERCENT"]) + "%"
    used.innerHTML = this.status["STORAGE_USED"]
    var step = myMath.round(this.status["STORAGE_USED_PERCENT"], -1)
    if (step > 100) step = 100
    used.className += " step" + step
    total.appendChild(used)
    container.appendChild(total)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomCPUTemp : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_cpu_temp"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "CPU"
    var container = document.createElement("div")
    container.className = "container"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['CPU_TEMPERATURE'] + '\°C'
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomGPUTemp : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_gpu_temp"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "GPU"
    var container = document.createElement("div")
    container.className = "container"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['GPU_TEMPERATURE'] + '\°C'
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomUptime : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_uptime"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "UPTIME"
    var container = document.createElement("div")
    container.className = "container"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['UPTIME']
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomCPUUsage : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_cpu_usage"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "CPU %"
    var container = document.createElement("div")
    container.className = "container"
    var total = document.createElement("div")
    total.className = "total"
    total.innerHTML = " &nbsp;"
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = Math.round(this.status["CPU_USAGE"]) + "%"
    used.innerHTML = this.status["CPU_USAGE"] + "%"
    var step = myMath.round(this.status["CPU_USAGE"], -1)
    if (step > 100) step = 100
    used.className += " step" + step
    total.appendChild(used)
    container.appendChild(total)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },
})
