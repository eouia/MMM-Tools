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
    device : "RPI",
    refresh_interval_ms : 1000 * 5,
    warning_interval_ms : 1000 * 60 * 5,
    enable_warning : true,
    recordUptime: false,
    warning : {
      CPU_TEMPERATURE : 65,
      GPU_TEMPERATURE : 65,
      CPU_USAGE : 75,
      STORAGE_USED_PERCENT : 80,
      MEMORY_USED_PERCENT : 80,
    },
    uptime: { // display uptime in your language
      day: "day",
      hour: "hour",
      minute: "minute",
      plurial: "s"
    }
  },

  start: function() {
    this.session = {}
    this.status = {
      OS : "Unknow",
      IP : "",
      MEMORY_TOTAL : "",
      STORAGE_TOTAL : "",
      CPU_TEMPERATURE : "",
      GPU_TEMPERATURE : "",
      UPTIME : "",
      RECORD: "",
      CPU_USAGE : "",
      MEMORY_USED : "",
      MEMORY_USED_PERCENT : 0,
      STORAGE_USED : "",
      STORAGE_USED_PERCENT : 0,
      SCREEN_STATUS : "",
    }
    this.warningRecord = {}
    this.config = this.configAssignment({}, this.defaults, this.config)
    this.sendSocketNotification('CONFIG', this.config)
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      id: "translations/id.json",
      fr: "translations/fr.json",
      sv: "translations/sv.json",
    }
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
      if(this.data.position) {
        this.updateDom()
      } else {
        return
      }
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
                var text = this.translate(name).replace("%VAL%", this.status[name])
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

/** Dom **/
  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "Tools"
    wrapper.appendChild(this.getDomOS())
    wrapper.appendChild(this.getDomIP())
    wrapper.appendChild(this.getDomMemory())
    wrapper.appendChild(this.getDomStorage())
    wrapper.appendChild(this.getDomCPUTemp())
    if(this.config.device != "RPI") wrapper.appendChild(this.getDomGPUTemp())
    wrapper.appendChild(this.getDomUptime())
    if (this.config.recordUptime) wrapper.appendChild(this.getDomRecord())
    wrapper.appendChild(this.getDomCPUUsage())
    return wrapper
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

  getDomOS : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_OS"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "OS"
    var container = document.createElement("div")
    container.className = "container"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['OS']
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

  getDomRecord : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item status_record"
    var label = document.createElement("div")
    label.className = "item_label"
    label.innerHTML = "RECORD"
    var container = document.createElement("div")
    container.className = "container"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['RECORD']
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

/** TelegramBot **/

  getCommands : function(register) {
    if (register.constructor.name == 'TelegramBotCommandRegister') {
      register.add({
        command: 'status',
        description: this.translate("CMD_TELBOT_STATUS_DESCRIPTION"),
        callback: 'cmd_status'
      })
      register.add({
        command: 'screen',
        description: this.translate("CMD_TELBOT_SCREEN_DESCRIPTION"),
        callback: 'cmd_screen',
        args_pattern : [/^on|off/i],
        args_mapping : ['onoff']
      })
    }
  },

  cmd_status : function (command, handler) {
    var text = ""
    text += "*OS :* `" + this.status['OS'] + "`,\n"
    text += "*" + this.translate("IP") + " :* `" + this.status['IP'] + "`,\n"
    text += "*" + this.translate("RAM Used") + " :* `" + this.status['MEMORY_USED_PERCENT'] + "%`,\n"
    text += "*" + this.translate("SD Used") + " :* `" + this.status['STORAGE_USED_PERCENT'] + "%`,\n"
    text += "*" + this.translate("CPU Temp.") + " :* `" + this.status['CPU_TEMPERATURE'] + "\°C`,\n"
    if (this.config.device != "RPI") text += "*" + this.translate("GPU Temp.") + " :* `" + this.status['GPU_TEMPERATURE'] + "\°C`,\n"
    text += "*" + this.translate("Uptime") + " :* `" + this.status['UPTIME'] + "`,\n"
    if (this.config.recordUptime) text += "*Record :* `" + this.status['RECORD'] + "`,\n"
    text += "*" + this.translate("CPU Usage") + " :* `" + this.status['CPU_USAGE'] + "%`,\n"
    text += "*" + this.translate("Display") + " :* `" + this.status['SCREEN_STATUS'] + "`.\n"
    if (handler.constructor.name == 'AssistantHandler') {
      text = text.replace(/\*/g, "").replace(/\`/g, "")
    }
    handler.reply('TEXT', text, {parse_mode:'Markdown'})
  },

  cmd_screen : function (command, handler) {
    if (!handler.args) {
      handler.reply(
        'TEXT',
        this.translate("CMD_TELBOT_SCREEN_NO_ARGS"),
        {parse_mode:'Markdown'}
      )
    } else {
      if (handler.args['onoff']) {
        if (handler.args['onoff'].toLowerCase() == this.translate('CMD_TELBOT_SCREEN_ON')) {
          handler.reply('TEXT', this.translate("CMD_TELBOT_SCREEN_ON_RESULT"))
          this.sendSocketNotification('SCREEN_ON')
        }
        if (handler.args['onoff'].toLowerCase() == this.translate('CMD_TELBOT_SCREEN_OFF')) {
          handler.reply('TEXT', this.translate("CMD_TELBOT_SCREEN_OFF_RESULT"))
          this.sendSocketNotification('SCREEN_OFF')
        }
      } else {
        handler.reply(
          'TEXT',
          this.translate("CMD_TELBOT_SCREEN_NO_ARGS"),
          {parse_mode:'Markdown'}
        )
      }
    }
  },

  configAssignment : function (result) {
    var stack = Array.prototype.slice.call(arguments, 1)
    var item
    var key
    while (stack.length) {
      item = stack.shift()
      for (key in item) {
        if (item.hasOwnProperty(key)) {
          if (typeof result[key] === "object" && result[key] && Object.prototype.toString.call(result[key]) !== "[object Array]") {
            if (typeof item[key] === "object" && item[key] !== null) {
              result[key] = this.configAssignment({}, result[key], item[key])
            } else {
              result[key] = item[key]
            }
          } else {
            result[key] = item[key]
          }
        }
      }
    }
    return result
  },
})
