//抽取函数
function resolvePromise(p2, x, resolve, reject) {
    if (p2 === x) {

        throw new TypeError('Chaining cycle detected for promise #<Promise>')
    } else if (x instanceof myPromise) {
        x.then(res => resolve(res), err => reject(err))
    } else {
        resolve(x)
    }
}
function runAsynctask(callback) {
    if (typeof queueMicrotask === "function") {
        queueMicrotask(callback)
    } else if (typeof MutationObserver === "function") {
        const obs = new MutationObserver(callback)
        const divnode = document.createElement('div')
        obs.observe(divnode, { childList: true })
        divnode.innerHTML = 'ok'
    } else {
        setTimeout(callback, 0)
    }
}
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class myPromise {
    state = PENDING
    result = undefined
    #handlers = []
    constructor(func) {
        const resolve = (result) => {
            if (this.state === PENDING) {
                this.state = FULFILLED
                this.result = result

                this.#handlers.forEach(({ onFulfilled }) => {
                    onFulfilled(this.result)
                })
            }

        }
        const reject = (result) => {
            if (this.state === PENDING) {
                this.state = REJECTED
                this.result = result

                this.#handlers.forEach(({ onRejected }) => {
                    onRejected(this.result)
                })
            }

        }
        func(resolve, reject)
    }


    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : x => x
        onRejected = typeof onRejected === "function" ? onRejected : x => { throw x }
        const p2 = new myPromise((resolve, reject) => {
            if (this.state === FULFILLED) {
                runAsynctask(() => {
                    try {

                        const x = onFulfilled(this.result)
                        resolvePromise(p2, x, resolve, reject)
                        /*  if (p2 === x) {

                             throw new TypeError('Chaining cycle detected for promise #<Promise>')
                         } else if (x instanceof myPromise) {
                             x.then(res => resolve(res), err => reject(err))
                         } else {
                             resolve(x)
                         } */
                    } catch (error) {
                        reject(error)
                    }
                })

            } else if (this.state === REJECTED) {
                runAsynctask(() => {
                    //1.处理异常
                    try {
                        //2.获取返回值
                        const x = onRejected(this.result)
                        //4.调用函数
                        resolvePromise(p2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }

                })

            } else if (this.state === PENDING) {
                this.#handlers.push({
                    onFulfilled: () => {
                        runAsynctask(() => {
                            try {

                                const x = onFulfilled(this.result)
                                resolvePromise(p2, x, resolve, reject)

                            } catch (error) {
                                reject(error)
                            }
                        })
                    }
                    , onRejected: () => {
                        runAsynctask(() => {
                            //1.处理异常
                            try {
                                //2.获取返回值
                                const x = onRejected(this.result)
                                //4.调用函数
                                resolvePromise(p2, x, resolve, reject)
                            } catch (error) {
                                reject(error)
                            }
                        })
                    }
                })
            }
        })

        return p2
    }


}