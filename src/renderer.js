const searchInput = document.getElementById('search')
const resultsDiv = document.getElementById('results')


searchInput.addEventListener('input', async (e) => {
    const searchTerm = e.target.value
    if (searchTerm === '') {
        resultsDiv.innerHTML = ''
        return
    }
    const filteredApps = await window.electronAPI.searchApps(searchTerm)
    // console.log({ filteredApps })
    resultsDiv.innerHTML = ''
    filteredApps.slice(0, 5).forEach(app => {
        const appDiv = document.createElement('div')
        appDiv.setAttribute('tabIndex', 0)
        appDiv.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                // console.log('event target', event)
                searchInput.value = ''
                resultsDiv.innerHTML = ''
                searchInput.focus();
                window.electronAPI.launchApp(app.exec)
            }
        })
        appDiv.classList.add('app-item')
        let imgElem = ''
        if (app.icon !== null) {
            imgElem = `<img class="app-icon" src="${app.icon}">`
        }
        else if (app.icon == null && app.iconV2 !== null) {
            imgElem = `<img class="app-icon" src="${app.iconV2}">`
        } else {
            imgElem = `<div style="background-color: goldenrod" class="app-icon-placeholder"></div>`
        }


        appDiv.onclick = () => {
            window.electronAPI.launchApp(app.exec)
        }
        appDiv.innerHTML = `${imgElem} <span>${app.name}</span>`
        resultsDiv.appendChild(appDiv)
    })
})

searchInput.focus();


let current = -1;
document.addEventListener('keydown', (event) => {

    let allAppElems = document.querySelectorAll('.app-item');

    if (event.key === 'Escape') {
        searchInput.value = '';
        resultsDiv.innerHTML = '';
        searchInput.focus();
        window.electronAPI.hideWindow()
    }

    if (event.key === 'ArrowDown') {
        current++;
        if (current >= allAppElems.length) {
            current = 0;
        }
        // console.log({ current, allAppElems })
        allAppElems[current].focus();
    }

    if (event.key === 'ArrowUp') {
        current--;
        if (current <= -1) {
            current = allAppElems.length - 1;
        }
        // console.log({ current, allAppElems })
        allAppElems[current].focus();
    }
})