/* Magic Mirror
 * Module: MMM-Tools v2
 * @bugsounet
 */
var myMath= {}

myMath.round = function(number, precision) {
     var factor = Math.pow(10, precision)
     var tempNumber = Math.round(number * factor)
     return tempNumber / factor
 }

Module.register("MMM-Tools", {
  defaults: {
    debug: false,
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
      nativeNetwork: true,
      displayDefaultNetwork: true
    },
    UPTIME: {
      displayUptime: true,
      useMagicMirror: true,
      orderUptime: 8,
      displayRecord: true,
      orderRecord: 9
    },
    WARNING: {
      enableWarning: false,
      interval: 1000 * 60 * 5,
      check : {
        CPU_TEMP : 65,
        CPU_USAGE : 75,
        STORAGE_USED : 80,
        MEMORY_USED : 80,
      }
    }
  },

  start: function() {
    this.session = {}
    this.status = {
      OS: 'Loading...',
      NETWORK: [],
      MEMORY: {
        total: 0,
        used: 0,
        percent: 0
      },
      STORAGE: [],
      CPU: {
        usage: 0,
        type: 'Loading...',
        temp: 0
      },
      UPTIME: 0,
      RECORD: 0
    }
    this.defaults.uptime= {
      day: this.translate("DAY"),
      days: this.translate("DAYS"),
      hour: this.translate("HOUR"),
      hours: this.translate("HOURS"),
      minute: this.translate("MINUTE"),
      minutes: this.translate("MINUTES")
    }
    this.config = configMerge({}, this.defaults, this.config)
    this.sendSocketNotification('CONFIG', this.config)
    this.container = 0
    this.item = 0
    this.hidden = false
    this.warningRecord = {}
    if (this.config.containerSize && this.config.itemSize) {
      this.containerSize = this.config.containerSize
      this.itemSize = this.config.itemSize
      this.init = true
      this.initialized = true
    } else {
      this.containerSize = 0
      this.itemSize = 0
      this.init = false
      this.initialized = false
    }
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      id: "translations/id.json",
      fr: "translations/fr.json",
      sv: "translations/sv.json",
      de: "translations/de.json",
      it: "translations/it.json"
    }
  },

  getStyles: function () {
    return [
      "MMM-Tools.css",
    ]
  },

  getScripts: function () {
    return [
     "configMerge.min.js"
    ]
  },

  socketNotificationReceived: function (notification, payload) {
    if(notification === "STATUS") {
      this.status = payload
      this.checkWarning()
      if (!this.config.containerSize) this.containerSize = (this.container * 7) + 10
      else this.containerSize = this.config.containerSize
      if (!this.config.itemSize) this.itemSize = (this.item * 7) + 10
      else this.itemSize = this.config.itemSize

      if(this.data.position) {
        this.updateDom()
        this.init= true
      } else {
        return
      }
    }
  },

  suspend: function() {
    this.hidden = true
    console.log("MMM-Tools is suspended.")
  },

  resume: function () {
    this.hidden = false
    console.log("MMM-Tools is resumed.")
  },

/** Dom **/
  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "Tools"
    /** hide module for calculate module size **/
    if (!this.init) {
      if (!this.hidden) this.hide(0, {lockString: "TOOLS_LOCKED"})
    }
    else if (!this.initialized) {
      this.show(1000, {lockString: "TOOLS_LOCKED"})
      this.initialized = true
    }
    /**********/
    if (this.config.OS.displayOs) wrapper.appendChild(this.getDomOS())
    if (this.config.NETWORK.displayNetwork) wrapper.appendChild(this.getDomIP())
    if (this.config.RAM.displayRam) wrapper.appendChild(this.getDomMemory())
    if (this.config.STORAGE.displayStorage) wrapper.appendChild(this.getDomStorage())
    if (this.config.CPU.displayTemp) wrapper.appendChild(this.getDomCPUTemp())
    if (this.config.CPU.displayType) wrapper.appendChild(this.getDomCPUType())
    if (this.config.UPTIME.displayUptime) wrapper.appendChild(this.getDomUptime())
    if (this.config.UPTIME.displayRecord) wrapper.appendChild(this.getDomRecord())
    if (this.config.CPU.displayUsage) wrapper.appendChild(this.getDomCPUUsage())
    return wrapper
  },

  getDomIP : function () {
    var IPs = document.createElement("div")
    IPs.style.order = this.config.NETWORK.orderNetwork
    this.status['NETWORK'].forEach(interface => {
      for (let [type, valeur] of Object.entries(interface)) {
        var wrapper = document.createElement("div")
        wrapper.className = "status_item"
        var label = document.createElement("div")
        label.className = "item_label"
        label.style.width = this.itemSize + "px"
        let testItem
        if (this.config.NETWORK.nativeNetwork) {
          label.innerHTML = (this.config.NETWORK.displayDefaultNetwork && valeur.default && this.status['NETWORK'].length > 1) ? "* " + valeur.name : valeur.name
          testItem = (this.config.NETWORK.displayDefaultNetwork && valeur.default && this.status['NETWORK'].length > 1) ? valeur.name.length +3 : valeur.name.length+1
        }
        else {
          label.innerHTML = (this.config.NETWORK.displayDefaultNetwork && valeur.default && this.status['NETWORK'].length > 1) ? "* " + this.translate(type) : this.translate(type)
          testItem = (this.config.NETWORK.displayDefaultNetwork && valeur.default && this.status['NETWORK'].length > 1) ? this.translate(type).length +2 : this.translate(type).length
        }
        if (testItem > this.item ) this.item = testItem
        var container = document.createElement("div")
        container.className = "container"
        container.style.width = this.containerSize + "px"
        var value = document.createElement("div")
        value.className = "value"
        value.innerHTML = valeur.ip
        if (valeur.ip.length > this.container ) this.container = valeur.ip.length
        container.appendChild(value)
        wrapper.appendChild(label)
        wrapper.appendChild(container)
        IPs.appendChild(wrapper)
      }
    })
    return IPs
  },

  getDomOS : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.OS.orderOs
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("OS")
    if (this.translate("OS").length > this.item ) this.item = this.translate("OS").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['OS']
    if (this.status['OS'].length > this.container ) this.container = this.status['OS'].length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomMemory : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.RAM.orderRam
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("RAM")
    if (this.translate("RAM").length > this.item ) this.item = this.translate("RAM").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var total = document.createElement("div")
    total.className = "total"
    total.innerHTML = this.status["MEMORY"].total
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = Math.round(this.status["MEMORY"].percent) + "%"
    var step = myMath.round(this.status["MEMORY"].percent, -1)
    if (step > 100) step = 100
    used.className += " step" + step
    used.innerHTML = this.status["MEMORY"].used
    total.appendChild(used)
    container.appendChild(total)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomStorage : function() {
    var Storage = document.createElement("div")
    Storage.style.order = this.config.STORAGE.orderStorage
    this.status['STORAGE'].forEach(partition => {
      for (let [name, valeur] of Object.entries(partition)) {
        if (!this.config.STORAGE.partitionExclude.includes(name)) {
          var wrapper = document.createElement("div")
          wrapper.className = "status_item"
          var label = document.createElement("div")
          label.className = "item_label"
          label.style.width = this.itemSize + "px"
          label.innerHTML = name
          if (name.length > this.item) this.item = name.length
          var container = document.createElement("div")
          container.className = "container"
          container.style.width = this.containerSize + "px"
          var total = document.createElement("div")
          total.className = "total"
          total.innerHTML = valeur.size
          var used = document.createElement("div")
          used.className = "used bar"
          used.style.width = Math.round(valeur.use) + "%"
          used.innerHTML = valeur.used
          var step = myMath.round(valeur.use, -1)
          if (step > 100) step = 100
          used.className += " step" + step
          total.appendChild(used)
          container.appendChild(total)
          wrapper.appendChild(label)
          wrapper.appendChild(container)
          Storage.appendChild(wrapper)
        }
      }
    })
    return Storage
  },

  getDomCPUTemp : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.CPU.orderTemp
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("CPU Temp.")
    if (this.translate("CPU Temp.").length > this.item ) this.item = this.translate("CPU Temp.").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var total = document.createElement("div")
    total.className = "total"
    total.innerHTML = this.status['CPU'].temp + '\°C'
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = this.status['CPU'].temp + "%"
    var step = myMath.round(this.status['CPU'].temp, -1)
    if (step > 100) step = 100
    used.className += " step" + step
    total.appendChild(used)
    container.appendChild(total)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomCPUType : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.CPU.orderType
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("TYPE")
    if (this.translate("TYPE").length > this.item ) this.item = this.translate("TYPE").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['CPU'].type
    if (this.status['CPU'].type.length > this.container ) this.container = this.status['CPU'].type.length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomUptime : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.UPTIME.orderUptime
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("UPTIME")
    if (this.translate("UPTIME").length > this.item ) this.item = this.translate("UPTIME").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['UPTIME']
    if (this.status['UPTIME'].length > this.container ) this.container = this.status['UPTIME'].length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomRecord : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.UPTIME.orderRecord
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("RECORD")
    if (this.translate("RECORD").length > this.item ) this.item = this.translate("RECORD").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['RECORD']
    if (this.status['RECORD'].length > this.container ) this.container = this.status['RECORD'].length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomCPUUsage : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.CPU.orderUsage
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("CPU Usage")
    if (this.translate("CPU Usage").length > this.item ) this.item = this.translate("CPU Usage").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var total = document.createElement("div")
    total.className = "total"
    total.innerHTML = " &nbsp;"
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = Math.round(this.status["CPU"]["usage"]) + "%"
    used.innerHTML = this.status["CPU"]["usage"] + "%"
    var step = myMath.round(this.status["CPU"]["usage"], -1)
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
    }
  },

  cmd_status : function (command, handler) {
    var text = ""
    /* Os */
    text += "*" + this.translate("OS") + " :* `" + this.status['OS'] + "`\n"
    /* Type */
    text += "*" + this.translate("TYPE") + " :* `" + this.status['CPU'].type + "`\n"
    /* Network */
    this.status['NETWORK'].forEach(interface => {
      for (let [type, valeur] of Object.entries(interface)) {
        let name
        if (this.config.NETWORK.nativeNetwork) {
          name = (this.config.NETWORK.displayDefaultNetwork && valeur.default && this.status['NETWORK'].length > 1) ? "+ " + valeur.name : valeur.name
        }
        else {
          name = (this.config.NETWORK.displayDefaultNetwork && valeur.default && this.status['NETWORK'].length > 1) ? "+ " + this.translate(type) : this.translate(type)
        }
        text += "*" + name + " :* `" + valeur.ip + "`\n"
      }
    })
    /* MEMORY*/
    text += "*" + this.translate("RAM Used") + " :* `" + this.status['MEMORY'].percent + "%`\n"
    /* Storage */
    this.status['STORAGE'].forEach(partition => {
      for (let [name, valeur] of Object.entries(partition)) {
        text += "*" + this.translate("PARTITION") + " " + name + " :* `" + valeur.use + "%`\n"
      }
    })
    /* CPU */
    text += "*" + this.translate("CPU Temp.") + " :* `" + this.status['CPU'].temp + "\°C`\n"
    text += "*" + this.translate("CPU Usage") + " :* `" + this.status['CPU'].usage + "%`\n"
    /* Uptime */
    text += "*" + this.translate("UPTIME") + " :* `" + this.status['UPTIME'] + "`\n"
    if (this.config.UPTIME.displayRecord) text += "*" + this.translate("RECORD") + " :* `" + this.status['RECORD'] + "`\n"

    if (handler.constructor.name == 'AssistantHandler') {
      text = text.replace(/\*/g, "").replace(/\`/g, "")
    }
    handler.reply('TEXT', text, {parse_mode:'Markdown'})
  },

  /** warning **/
  checkWarning : function() {
    if (this.config.WARNING.enableWarning) {
      for (var name in this.config.WARNING.check) {
        var chkValue = this.config.WARNING.check[name]
        if (name == "CPU_TEMP") {
          let actualValue = parseFloat(this.status["CPU"].temp)
          if (chkValue < actualValue) this.doWarning(name, actualValue, chkValue)
        }
        if (name == "CPU_USAGE") {
          let actualValue = parseFloat(this.status["CPU"].usage)
          if (chkValue < actualValue) this.doWarning(name, actualValue, chkValue)
        }
        if (name == "MEMORY_USED") {
          let actualValue = parseFloat(this.status["MEMORY"].percent)
          if (chkValue < actualValue) this.doWarning(name, actualValue, chkValue)
        }
        if (name == "STORAGE_USED") {
          this.status['STORAGE'].forEach(partition => {
            for (let [mount, value] of Object.entries(partition)) {
              if (!this.config.STORAGE.partitionExclude.includes(mount)) {
                let actualValue = parseFloat(value.use)
                if (chkValue < actualValue) this.doWarning(name, actualValue, chkValue, mount)
              }
            }
          })
        }
      }
    }
  },

  /** do warning **/
  doWarning: function (name, value, check, mount) {
    if (name && value && check) {
      var now = Date.now()
      var record = (this.warningRecord[name + (mount ? " " + mount : "")]) ? this.warningRecord[name  + (mount ? " " + mount : "")] : 0
      if (record + this.config.WARNING.interval < now) {
        this.warningRecord[name + (mount ? " " + mount : "")] = now
        /** send noti **/
        if (mount) {
          this.sendNotification("TOOLS_WARNING", {
            timestamp : now,
            type : name,
            condition : check,
            value : value,
            mount : mount
          })
          var text = this.translate("PARTITION") + " " + mount + ": " + this.translate(name).replace("%VAL%", value)
        } else {
          this.sendNotification("TOOLS_WARNING", {
            timestamp : now,
            type : name,
            condition : check,
            value : value
          })
          var text = this.translate(name).replace("%VAL%", value)
        }
        /** send to Telegram **/
        this.sendNotification("TELBOT_TELL_ADMIN", text)
      }
    } 
  }
})
