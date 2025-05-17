# Idea
- A web app that tracks your earnings based on the shift start time, shift duration and wage per hour, it will also take into account break times and stop earnings while break time is active, this will all be done based on local time on the device

# What I need
- an input for wage per hour (number)
- an input for shift start time
- an input for shift duration (2 seperate number inputs for hours and minutes)
- an input for break start time
- an input for break duration (2 seperate number inputs for hours and minutes)
- a start and end button
- a current earnings indicator in £
- a weekly earnings tracker 
- shows a history previous timers
- saves to local memory so I can refresh the page and all the previous timers are there still and when I close the web page, it will keep the timer running in the background

# Tech Stack
- 11ty
- Nunjucks

# How I want it to work
- You input all your shift settings (wage, shift start time, shift duration, break start time, break duration)
- When you press start, it will begin a timer counting down based on the shift duration you selected
- The current earnings indicator will increased based on the wage per hour you selected
- The shift duration timer will ONLY start counting down when the local time on the device reaches the time set in the shift start time
- There will be a countdown timer counting down the time until the shift duration timer starts
- Once the local time on the device has reached the break start time, Orange text will appear saying Break Time, the earnings indicator will STOP counting up for the duration of the break time duration and it will pause at the current value at the time of the break timer starting
- Once the break time duration has ended, the earning indicator will resume counting up from the value it was at when the break time duration started
- For example, if the earnings indicator was at £0.16 when the break time duration started, it will then continue counting up from £0.16 ONLY when the break time duration has ended
- When the break time duration timer has ended, the Orange text will disappear
- When the shift duration timer has ended, it will automatically be added to the weekly earnings AND the previous timers history
- When you press the end shift buttom, this will also automatically add to the earnigns to the weekly earnings AND the previous timers history and it will reset the current earnings indicator back to 0

# Theme
- Glassmorphic theme
- blue (but NOT man city blue)