export function videoInitialPlay() {
    if (document.getElementById('playPauseControlImg').src.slice(document.getElementById('playPauseControlImg').src.length - 8, -4) == 'play') {
        document.getElementById('playPauseControlImg').src = 'img/pause.png';
    }
    video.currentTime = 0;
    video.play();
}
