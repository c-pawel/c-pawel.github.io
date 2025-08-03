document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('albumId');
    const trackId = urlParams.get('trackId');
    
    const trackTitle = document.getElementById('track-title');
    const trackCover = document.getElementById('track-cover');
    const albumInfo = document.getElementById('album-info');
    const lyricsContainer = document.getElementById('lyrics-container');
    const backToAlbumLink = document.getElementById('back-to-album');

    // Ładowarka danych
    fetch('../data/discography.json')
        .then(response => response.json())
        .then(data => {
            let track = null;
            let album = null;
            
            if (albumId) {
                album = data.albums.find(a => a.id == albumId);
                if (album) {
                    track = album.tracks.find(t => t.id == trackId);
                    backToAlbumLink.href = `../album.html?id=${album.id}`;
                }
            } else {
                track = data.other_tracks.find(t => t.id == trackId);
                backToAlbumLink.href = '../album.html?other=true';
            }
            
            if (!track) {
                window.location.href = '../textindex.html';
                return;
            }
            
            displayTrackInfo(track, album);
            // Dodawanie danych do cache
            localStorage.setItem('discographyCache', JSON.stringify(data));
            localStorage.setItem('cacheTime', new Date().getTime());
        })
        .catch(() => {
            // Fallback z cache
            const cachedData = localStorage.getItem('discographyCache');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                let track = null;
                let album = null;
                
                if (albumId) {
                    album = data.albums.find(a => a.id == albumId);
                    if (album) track = album.tracks.find(t => t.id == trackId);
                } else {
                    track = data.other_tracks.find(t => t.id == trackId);
                }
                
                if (track) displayTrackInfo(track, album);
            }
        });
    
    // Funkcja wyświetlająca informacje o numerze
    function displayTrackInfo(track, album) {
        trackTitle.textContent = track.title;
        
        if (album) {
            trackCover.src = `../images/${album.cover}`;
            albumInfo.innerHTML = `Z albumu: <strong>${album.title}</strong>`;
        } else {
            trackCover.src = `../images/${track.cover}`;
            albumInfo.innerHTML = 'Singiel';
        }
        
        lyricsContainer.textContent = track.lyrics;
    }

    // Czyszczenie cache
    window.addEventListener('beforeunload', function() {
    localStorage.clear();
    sessionStorage.clear();
    });
});