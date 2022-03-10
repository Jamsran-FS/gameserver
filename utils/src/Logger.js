let LEVEL = null

class Logger {

    /**
     * @private
     * @type {string}
     */
    namespace = null

    /**
     * @private
     * @type {Map<number,string>}
     */
    levels = new Map()

    /**
     * 
     * @param {string} namespace 
     */
    constructor(namespace) {
        this.namespace = namespace
        for (let key in Logger.LEVEL) {
            this.levels.set(Logger.LEVEL[key], key)
        }
    }

    /**
     * 
     * @param  {...any} args 
     * @returns {void}
     */
    error(...args) {
        if (LEVEL < Logger.LEVEL.ERROR) {
            return
        }
        this.log(Logger.LEVEL.ERROR, ...args)
    }

    /**
     * 
     * @param  {...any} args 
     * @returns {void}
     */
    warning(...args) {
        if (LEVEL < Logger.LEVEL.WARNING) {
            return
        }
        this.log(Logger.LEVEL.WARNING, ...args)
    }

    /**
     * 
     * @param  {...any} args 
     * @returns {void}
     */
    info(...args) {
        if (LEVEL < Logger.LEVEL.INFO) {
            return
        }
        this.log(Logger.LEVEL.INFO, ...args)
    }

    /**
     * 
     * @param  {...any} args 
     * @returns {void}
     */
    debug(...args) {
        if (LEVEL < Logger.LEVEL.DEBUG) {
            return
        }
        this.log(Logger.LEVEL.DEBUG, ...args)
    }

    /**
     * 
     * @param  {...any} args 
     * @returns {void}
     */
    trace(...args) {
        if (LEVEL < Logger.LEVEL.TRACE) {
            return
        }
        this.log(Logger.LEVEL.TRACE, ...args)
    }

    /**
     * @private
     * @param {number} level 
     * @param  {...any} args 
     */
    log(level, ...args) {
        let logs = []
        for (let i = 0; i < args.length; i++) {
            let arg = args[i]
            if (i === args.length - 1 && arg instanceof Error) {
                continue   
            }
            if (arg instanceof Error) {
                logs.push(arg.message)
            } else {
                logs.push(arg)
            }   
        }
        let time = new Date().toISOString()
        if (level === Logger.LEVEL.ERROR) {
            console.error(`[${this.levels.get(level)}][${time}][${this.namespace}]:`, ...logs)
        } else if (level === Logger.LEVEL.WARNING) {
            console.warn(`[${this.levels.get(level)}][${time}][${this.namespace}]:`, ...logs)
        } else {
            console.log(`[${this.levels.get(level)}][${time}][${this.namespace}]:`, ...logs)
        }
    }

}

/**
 * @enum {number}
 */
 Logger.LEVEL = {
    NONE : 0,
    ERROR : 1,
    WARNING : 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
}

LEVEL = Logger.LEVEL.INFO

/**
 * @type {Map<string,Logger>}
 */
let instances = new Map()

/**
 * 
 * @param {string} namespace
 * @returns {Logger} 
 */
Logger.getLogger = (namespace) => {
    if (!instances.has(namespace)) {
        instances.set(namespace, new Logger(namespace))
    }
    return instances.get(namespace)
}

/**
 * 
 * @param {number} level 
 */
Logger.setLevel = (level) => {
    LEVEL = level
}

export default Logger