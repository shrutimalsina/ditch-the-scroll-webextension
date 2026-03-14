let timerStarted = false //no timer has started when first loaded

window.addEventListener("scroll", function(){ //user has started using instagram or facebook
    
    console.log("Scrolling Detected") //only for my info
    
    if (timerStarted === false){ //if this is the 1st time user has doomscrolled, we do everything inside
        window.setTimeout(after_45m, 2.7e+6); //it has been 45 minutes of scroling, now what?
        console.log("Doomscrolling started")
    
        function after_45m(){
            console.log("Doomscrolled for 45 minutes!")
        }
    
        let count = 0 //answers" has the doomscrolling been consistent? Its checking every 30 seconds
        window.setInterval(after_30s, 30000);
    
        function after_30s(){ 
            console.log(++count)
        }
        timerStarted = true
    }
})