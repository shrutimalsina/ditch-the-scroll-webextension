chrome.storage.local.set({ scrollTime: 0 })

const siteNames = {
    'www.instagram.com': 'Instagram',
    'www.tiktok.com': 'TikTok',
    'www.facebook.com': 'Facebook',
    'www.twitter.com': 'Twitter',
    'www.reddit.com': 'Reddit',
    'www.youtube.com': 'YouTube'
  }

chrome.storage.local.set({ currentSite: siteNames[window.location.hostname] })

let timerStarted = false //no timer has started when first loaded

let idleTimer = null //to see if use is idle or not?
let isIdle = true
let countInterval = null

window.addEventListener("scroll", function(){ //user has started using instagram or facebook
    
    console.log("Scrolling Detected") //only for my info

    clearTimeout(idleTimer)
    idleTimer = setTimeout(function(){
        clearInterval(countInterval)
        timerStarted = false  //they've been idle for 5 mins, pause counting
    }, 300000) // 300000 = 5 minutes
    
    if (timerStarted === false){ //if this is the 1st time user has doomscrolled, we do everything inside
        window.setTimeout(after_45m, 10000); //it has been 45 minutes of scroling, now what? 2.7e+6 for 45 min
        console.log("Doomscrolling started")
    
        function after_45m(){
            console.log("Doomscrolled for 45 minutes!")
            chrome.storage.local.set({ scrollTime: 45 })
        }
    
        let count = 0 //answers" has the doomscrolling been consistent? Its checking every 30 seconds
        countInterval = window.setInterval(after_30s, 30000);
    
        function after_30s(){ 
            console.log(++count)
            chrome.storage.local.set({ scrollTime: Math.round(count / 2) })
        }
        timerStarted = true
    }


})