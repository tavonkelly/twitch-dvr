setInterval(() => {
    const elements = document.getElementsByClassName("pl-controls-bottom");

    if (elements.length > 0 && elements[0].children.length !== 3) {
        injectSeek();
    }
}, 1000);

function injectSeek() {
    const element = document.getElementsByClassName("pl-controls-bottom")[0];
    let mouseDown = false;

    fetch(chrome.runtime.getURL("html/playerSeek.html"))
        .then(response => response.text()).then(text => {
            const template = document.createElement("template");
            template.innerHTML = text.trim();

            element.insertBefore(template.content.firstChild, element.firstChild);

            const twitchDvr = document.querySelector(".twitch-dvr");
            const playerSlider = document.querySelector(".twitch-dvr .player-slider");
            const sliderProg = document.querySelector(".twitch-dvr .player-slider__left");
            const sliderThumb = document.querySelector(".twitch-dvr .player-slider__thumb");
            const popupTop = document.querySelector(".twitch-dvr .player-slider__popup-container");
            const popupBottom = document.querySelector(".twitch-dvr .popup-arrow");
            const popupTimestamp = document.querySelector(".twitch-dvr .popup-timestamp");
            let video = document.querySelector("video");

            function onMouseMove(event) {
                let offsetX = event.offsetX;

                if (event.target === sliderThumb) {
                    offsetX += event.target.offsetLeft;
                }

                const frac = offsetX / playerSlider.offsetWidth;

                popupTop.style.left = Math.min(Math.max(offsetX - 10, 0), playerSlider.offsetWidth - 20) + "px";
                popupBottom.style.left = Math.min(Math.max(offsetX - 10, 0), playerSlider.offsetWidth - 20) + "px";

                if (mouseDown) {
                    sliderProg.style.width = (frac * 100) + "%";
                    sliderThumb.style.left = (frac * 100) + "%";
                }

                if (!video || video.buffered.length === 0) {
                    return;
                }

                const distance = video.buffered.end(0) - video.buffered.start(0);

                popupTimestamp.innerHTML = "-" + Math.floor((1 - frac) * distance);
            }

            playerSlider.addEventListener("mousemove", onMouseMove);

            function onClick(event) {
                mouseDown = false;

                let offsetX = event.offsetX;

                if (event.target === sliderThumb) {
                    offsetX += event.target.offsetLeft;
                }

                const frac = offsetX / playerSlider.offsetWidth;

                if (!video || video.buffered.length === 0) {
                    return;
                }

                const distance = video.buffered.end(0) - video.buffered.start(0);

                video.currentTime = video.buffered.end(0) - ((1 - frac) * distance);
            }

            playerSlider.addEventListener("click", onClick);

            function onMouseEnter() {
                popupTop.style.opacity = 1;
                popupBottom.style.opacity = 1;
                sliderThumb.style.opacity = 1;
            }

            playerSlider.addEventListener("mouseenter", onMouseEnter);

            function onMouseLeave() {
                popupTop.style.opacity = 0;
                popupBottom.style.opacity = 0;
                sliderThumb.style.opacity = 0;
            }

            playerSlider.addEventListener("mouseleave", onMouseLeave);

            function onMouseDown() {
                mouseDown = true;
            }

            playerSlider.addEventListener("mousedown", onMouseDown);

            function onMouseUp() {
                mouseDown = false;
            }

            playerSlider.addEventListener("mouseup", onMouseUp);

            const updateTask = setInterval(() => {
                if (mouseDown) {
                    return;
                }

                if (!video || video.buffered.length === 0) {
                    return;
                }

                const distance = video.buffered.end(0) - video.buffered.start(0);
                const pct = (1 - ((video.buffered.end(0) - video.currentTime) / distance));

                sliderProg.style.width = (pct * 100) + "%";
                sliderThumb.style.left = (pct * 100) + "%";
            }, 250);

            const manageTask = setInterval(() => {
                // check if the dvr is gone :o
                if (!document.body.contains(twitchDvr)) {
                    shutdown();
                    return;
                }

                if (!video) {
                    video = document.querySelector("video");
                }
            }, 1000);

            function shutdown() {
                clearInterval(updateTask);
                clearInterval(manageTask);
                playerSlider.removeEventListener("mousemove", onMouseMove);
                playerSlider.removeEventListener("click", onClick);
                playerSlider.removeEventListener("mouseenter", onMouseEnter);
                playerSlider.removeEventListener("mouseleave", onMouseLeave);
                playerSlider.removeEventListener("mousedown", onMouseDown);
                playerSlider.removeEventListener("mouseup", onMouseUp);
            }
        }).catch(console.error);
}
