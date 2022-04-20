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
    MM: {
      displayMM: true,
      orderMM: 0
    },
    NODE: {
      displayNode: true,
      orderNode: 1
    },
    NPM: {
      displayNpm: true,
      orderNpm: 2
    },
    OS: {
      displayOs: true,
      displayArch: true,
      orderOs: 3
    },
    CPU: {
      displayUsage: true,
      orderUsage: 8,
      displaySpeed: true,
      orderSpeed: 5,
      displayGovernor: true,
      orderGovernor:6,
      displayTemp: true,
      celciusTemp: true,
      orderTemp: 11,
      displayType: true,
      orderType: 4
    },
    RAM: {
      displayRam: true,
      orderRam: 9
    },
    STORAGE: {
      displayStorage: true,
      orderStorage: 10,
      partitionExclude : []
    },
    NETWORK: {
      displayNetwork: true,
      orderNetwork: 7,
      nativeNetwork: true,
      displayDefaultNetwork: true
    },
    UPTIME: {
      displayUptime: true,
      useMagicMirror: true,
      orderUptime: 12,
      displayRecord: true,
      orderRecord: 13
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
      MM: 'Loading...',
      OS: 'Loading...',
      NETWORK: [],
      MEMORY: {
        total: 0,
        used: 0,
        percent: 0
      },
      NODE: "unknow",
      NPM: "unknow",
      STORAGE: [],
      CPU: {
        usage: 0,
        type: 'Loading...',
        temp: {
          C: 0,
          F: 0
        },
        speed: "unknow",
        governor: "unknow"
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
    this.CPUAverage = []
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
      it: "translations/it.json",
      cs: "translations/cs.json",
      es: "translations/es.json",
      da: "translations/da.json",
      nl: "translations/nl.json"
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
    if (this.config.MM.displayMM) wrapper.appendChild(this.getDomMM())
    if (this.config.NODE.displayNode) wrapper.appendChild(this.getDomNode())
    if (this.config.NPM.displayNpm) wrapper.appendChild(this.getDomNpm())
    if (this.config.OS.displayOs) wrapper.appendChild(this.getDomOS())
    if (this.config.NETWORK.displayNetwork) wrapper.appendChild(this.getDomIP())
    if (this.config.CPU.displaySpeed) wrapper.appendChild(this.getDomCPUSpeed())
    if (this.config.CPU.displayGovernor) wrapper.appendChild(this.getDomGovernor())
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

  getDomMM : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.MM.orderMM
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("MM")
    if (this.translate("MM").length > this.item ) this.item = this.translate("MM").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['MM']
    if (this.status['MM'].length > this.container ) this.container = this.status['MM'].length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomNode : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.NODE.orderNode
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = "node"
    if (this.translate("node").length > this.item ) this.item = this.translate("node").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['NODE']
    if (this.status['NODE'].length > this.container ) this.container = this.status['NODE'].length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomNpm : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.NPM.orderNpm
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = "npm"
    if (this.translate("npm").length > this.item ) this.item = this.translate("npm").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status['NPM']
    if (this.status['NPM'].length > this.container ) this.container = this.status['NPM'].length
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
    used.style.opacity= 0.75
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
          used.style.opacity= 0.75
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
    total.innerHTML = this.config.CPU.celciusTemp ? (this.status['CPU'].temp.C + '\°C') : (this.status['CPU'].temp.F + '\°F')
    var used = document.createElement("div")
    used.className = "used bar"
    used.style.width = this.status['CPU'].temp.C + "%"
    used.style.opacity= 0.75
    var step = myMath.round(this.status['CPU'].temp.C, -1)
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

  getDomCPUSpeed : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.CPU.orderSpeed
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("CPU SPEED")
    if (this.translate("CPU SPEED").length > this.item ) this.item = this.translate("CPU SPEED").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status.CPU.speed
    if (this.status.CPU.speed.length > this.container ) this.container = this.status.CPU.speed.length
    container.appendChild(value)
    wrapper.appendChild(label)
    wrapper.appendChild(container)
    return wrapper
  },

  getDomGovernor : function () {
    var wrapper = document.createElement("div")
    wrapper.className = "status_item"
    wrapper.style.order = this.config.CPU.orderGovernor
    var label = document.createElement("div")
    label.className = "item_label"
    label.style.width = this.itemSize + "px"
    label.innerHTML = this.translate("CPU GOVERNOR")
    if (this.translate("CPU GOVERNOR").length > this.item ) this.item = this.translate("CPU GOVERNOR").length
    var container = document.createElement("div")
    container.className = "container"
    container.style.width = this.containerSize + "px"
    var value = document.createElement("div")
    value.className = "value"
    value.innerHTML = this.status.CPU.governor
    if (this.status.CPU.governor.length > this.container ) this.container = this.status.CPU.governor.length
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
    used.style.opacity= 0.75
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
    /* MM */
    text += "*" + this.translate("MM") + " :* `" + this.status['MM'] + "`\n"
    /* node */
    text += "*node :* `" + this.status['NODE'] + "`\n"
    /* npm */
    text += "*npm :* `" + this.status['NPM'] + "`\n"
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
    text += "*" + this.translate("CPU Temp.") + " :* `" + (this.config.CPU.celciusTemp ? (this.status['CPU'].temp.C + "\°C`\n") : (this.status['CPU'].temp.F + "\°F`\n"))
    text += "*" + this.translate("CPU Usage") + " :* `" + this.status['CPU'].usage + "%`\n"
    text += "*" + this.translate("CPU SPEED") + " :* `" + this.status['CPU'].speed + "`\n"
    text += "*" + this.translate("CPU GOVERNOR") + " :* `" + this.status['CPU'].governor + "`\n"
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
        if (name == "CPU_TEMP" && chkValue) {
          let actualValue = parseFloat(this.status["CPU"].temp)
          if (chkValue < actualValue) this.doWarning(name, actualValue, chkValue)
        }
        if (name == "CPU_USAGE" && chkValue) {
          let actualValue = parseFloat(this.status["CPU"].usage)
          this.CPUAvgWarn(actualValue, chkValue)
        }
        if (name == "MEMORY_USED" && chkValue) {
          let actualValue = parseFloat(this.status["MEMORY"].percent)
          if (chkValue < actualValue) this.doWarning(name, actualValue, chkValue)
        }
        if (name == "STORAGE_USED" && chkValue) {
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

  /** average CPU usage **/
  CPUAvgWarn: function(actual, check) {
    /** do Array of last 10 CPU Usage **/
    var average = 0
    if (this.CPUAverage.length >= 10) this.CPUAverage.splice(0,1)
    this.CPUAverage.push(actual)
    //console.log("Array:", this.CPUAverage)

    /** do the average **/
    this.CPUAverage.forEach(value => {
      average += value
    })
    average = (average/this.CPUAverage.length).toFixed(0)

    /** Check for Warning **/
    //console.log("Average:", average)
    if (check < average) this.doWarning("CPU_USAGE", average, check)
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
        /** verify if new command of TelegramBot exist **/
        /** replace specials chars for return no parse entities error **/
        /** actually need for example with `_` caracter in PARTITION **/
        try {
          text = TelegramBotExtraChars(text)
        } catch (e) {
          // do nothing
        }
        /** send to Telegram **/
        this.sendNotification("TELBOT_TELL_ADMIN", text)
      }
    } 
  }
})
