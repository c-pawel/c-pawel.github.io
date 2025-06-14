document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');
    const isOther = urlParams.get('other') === 'true';
    
    const albumTitle = document.getElementById('album-title');
    const albumCover = document.getElementById('album-cover');
    const releaseDate = document.getElementById('release-date');
    const tracksCount = document.getElementById('tracks-count');
    const tracksContainer = document.getElementById('tracks-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const resultsContainer = document.getElementById('results-container');
    const backToTracksBtn = document.getElementById('back-to-tracks');

    let albumData = null;
    let tracks = [];

    // Ładowanko danych
    fetch('../data/discography.json')
        .then(response => response.json())
        .then(data => {
            if (isOther) {
                albumData = {
                    title: 'Single',
                    cover: 'other.jpg',
                    tracks: data.other_tracks
                };
            } else {
                albumData = data.albums.find(a => a.id == albumId);
                if (albumData) {
                    albumData.tracks.sort((a, b) => (a.order || 0) - (b.order || 0));
                }
            }
            
            if (!albumData) {
                window.location.href = '../index.html';
                return;
            }
            
            displayAlbumInfo(albumData);
        })
        .catch(() => {
            // Fallback z cache
            const cachedData = localStorage.getItem('discographyCache');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                if (isOther) {
                    albumData = {
                        title: 'Single',
                        cover: 'other.jpg',
                        tracks: data.other_tracks
                    };
                } else {
                    albumData = data.albums.find(a => a.id == albumId);
                    if (albumData) {
                        albumData.tracks.sort((a, b) => (a.order || 0) - (b.order || 0));
                    }
                }
                if (albumData) displayAlbumInfo(albumData);
            }
        });
    
    // Funckja wyświetlająca dane o albumie
    function displayAlbumInfo(album) {
        albumTitle.textContent = album.title;
        albumCover.src = `../images/${album.cover}`;
        releaseDate.textContent = isOther ? '' : `Rok wydania: ${new Date(album.release_date).getFullYear()}`;
        tracksCount.textContent = `${album.tracks.length} utworów`;
        displayTracks(album.tracks);
    }

    // Funkcja wyświetlająca nutki
    function displayTracks(tracksList) {
        tracksContainer.innerHTML = '';
        tracks = tracksList;
        
        const trackList = document.createElement('ul');
        trackList.className = 'track-list';
        
        tracksList.forEach(track => {
            const trackItem = document.createElement('li');
            trackItem.className = 'track-item';
            trackItem.innerHTML = `
                <span class="track-number">${!isOther ? track.order + '.' : ''}</span>
                <span class="track-title">${track.title}</span>
            `;
            trackItem.addEventListener('click', () => {
                const url = isOther 
                    ? `track.html?trackId=${track.id}` 
                    : `track.html?albumId=${albumId}&trackId=${track.id}`;
                window.location.href = url;
            });
            trackList.appendChild(trackItem);
        });
        
        tracksContainer.appendChild(trackList);
    }

    // Wyszukiwarka v2
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());

    // Funkcja co zaczyna szukanko
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        const results = searchInAlbum(query, tracks);
        displaySearchResults(results, query);
    }

    // Funkcja do szukania
    function searchInAlbum(query, tracksList) {
        const results = [];
        const exactMatch = query.startsWith('"') && query.endsWith('"');
        const cleanQuery = exactMatch ? query.slice(1, -1) : query;
        const regex = new RegExp(exactMatch ? cleanQuery : cleanQuery.split(' ').join('|'), 'gi');
        
        tracksList.forEach(track => {
            const matches = track.lyrics.split('\n')
                .map((line, i, arr) => ({
                    line,
                    prev: i > 0 ? arr[i-1] : '',
                    next: i < arr.length-1 ? arr[i+1] : ''
                }))
                .filter(({line}) => regex.test(line.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')));
            
            if (matches.length) results.push({track, matches});
        });
        
        return results;
    }

    // Funckcja co wyświetla wyniki wyszukiwania
    function displaySearchResults(results, query) {
        resultsContainer.innerHTML = results.length ? '' : '<p>Nie znaleziono wyników</p>';
        
        results.forEach(({track, matches}) => {
            matches.forEach(({line, prev, next}) => {
                const resultEl = document.createElement('div');
                resultEl.className = 'search-result';
                resultEl.innerHTML = `
                    <h3>${track.title}</h3>
                    ${prev && `<p>${prev}</p>`}
                    <p class="highlight">${highlightMatch(line, query)}</p>
                    ${next && `<p>${next}</p>`}
                `;
                resultEl.addEventListener('click', () => {
                    window.location.href = isOther 
                        ? `track.html?trackId=${track.id}` 
                        : `track.html?albumId=${albumId}&trackId=${track.id}`;
                });
                resultsContainer.appendChild(resultEl);
            });
        });
        
        tracksContainer.classList.add('hidden');
        searchResults.classList.remove('hidden');
    }

    // Funkcja do podświetlania matchu
    function highlightMatch(text, query) {
        const exactMatch = query.startsWith('"') && query.endsWith('"');
        const cleanQuery = exactMatch ? query.slice(1, -1) : query;
        return text.replace(
            new RegExp(`(${cleanQuery.split(' ').join('|')})`, 'gi'),
            '<span class="highlight">$1</span>'
        );
    }
    
    backToTracksBtn.addEventListener('click', () => {
        searchResults.classList.add('hidden');
        tracksContainer.classList.remove('hidden');
        searchInput.value = '';
    });
    // Funkcja ustalająca format daty jako - rok
    function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
    }
});