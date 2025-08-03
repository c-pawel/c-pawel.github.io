document.addEventListener('DOMContentLoaded', () => {
    const albumsGrid = document.getElementById('albums-grid');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const resultsContainer = document.getElementById('results-container');
    const backToAlbumsBtn = document.getElementById('back-to-albums');

    let discography = [];

    // Ładowanie danych
    fetch('data/discography.json')
        .then(response => response.json())
        .then(data => {
            discography = data;
            displayAlbums(data.albums, data.other_tracks);

            // Dodawanie danych do pamięci lokalnej cache:
            localStorage.setItem('discographyCache', JSON.stringify(data));
            localStorage.setItem('cacheTime', new Date().getTime());
        })
        .catch(() => {
            // Fallback z cache
            const cachedData = localStorage.getItem('discographyCache');
            if (cachedData) {
                discography = JSON.parse(cachedData);
                displayAlbums(discography.albums, discography.other_tracks);
            }
        });

    // Wyświetlanie albumów
    function displayAlbums(albums, otherTracks) {
        albumsGrid.innerHTML = '';
        
        // Albumy
        albums.forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card bg-dark.bg-gradient';
            albumCard.innerHTML = `
                <img src="images/${album.cover}" alt="${album.title}" class="album-cover">
                <h3>${album.title}</h3>
                <p>${formatDate(album.release_date)}</p>
                <p>${album.tracks.length} ${getTrackWordForm(album.tracks.length)}</p>
            `;
            albumCard.addEventListener('click', () => {
                window.location.href = `album.html?id=${album.id}`;
            });
            albumsGrid.appendChild(albumCard);
        });
        
        // Album "Inne"
        if (otherTracks.length > 0) {
            const otherCard = document.createElement('div');
            otherCard.className = 'bg-dark.bg-gradient album-card';
            otherCard.innerHTML = `
                <img src="images/LOGO2T4.jpg" alt="Single" class="album-cover">
                <h3>Single</h3>
                <p>2008-2025<p>
                <p>${otherTracks.length} ${getTrackWordForm(otherTracks.length)}</p>
            `;
            otherCard.addEventListener('click', () => {
                window.location.href = 'album.html?other=true';
            });
            albumsGrid.appendChild(otherCard);
        }
    }

    // Funkcja do odmiany słowa "utwór"
    function getTrackWordForm(count) {
    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;
    
    if (count === 1) {
        return 'utwór';
    } else if ((lastTwoDigits >= 12 && lastTwoDigits <= 14) ||
               (lastDigit >= 5 && lastDigit <= 9) ||
               lastDigit === 0) {
        return 'utworów';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
        return 'utwory';
    } else {
        return 'utworów';
    }
}


    // Wyszukiwarka
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Funkcja rozpoczynająca wyszukiwanie
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        const results = searchLyrics(query, discography);
        displaySearchResults(results, query);
    }

    // Funkcja do szukania
    function searchLyrics(query, data) {
        const results = [];
        const exactMatch = query.startsWith('"') && query.endsWith('"');
        const cleanQuery = exactMatch ? query.slice(1, -1) : query;
        const regex = new RegExp(exactMatch ? cleanQuery : cleanQuery.split(' ').join('|'), 'i');
        
        data.albums.forEach(album => {
            album.tracks.forEach(track => {
                const matches = findMatchesInText(track.lyrics, regex);
                if (matches.length > 0) {
                    results.push({
                        type: 'track',
                        track,
                        album,
                        matches
                    });
                }
            });
        });
        
        data.other_tracks.forEach(track => {
            const matches = findMatchesInText(track.lyrics, regex);
            if (matches.length > 0) {
                results.push({
                    type: 'other_track',
                    track,
                    matches
                });
            }
        });
        
        return results;
    }

    // Funkcja wyszukująca pasujące wyrazy w tekstach
    function findMatchesInText(text, regex) {
        const sentences = text.split('\n').filter(s => s.trim());
        const matches = [];
        
        sentences.forEach((sentence, index) => {
            if (regex.test(cleanText(sentence))) {
                const prev = index > 0 ? sentences[index-1] : '';
                const next = index < sentences.length-1 ? sentences[index+1] : '';
                matches.push({ sentence, prev, next });
            }
        });
        
        return matches;
    }
    
    //Funkcja pozwalająca ignorować znaki interpunkcyjne, specjalne oraz wielkość liter
    function cleanText(text) {
        return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();
    }

    // Funckja wyświetlająca wyniki wyszukiwania
    function displaySearchResults(results, query) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>Nie znaleziono wyników</p>';
        } else {
            resultsContainer.innerHTML = '';
            results.forEach(result => {
                result.matches.forEach(match => {
                    const resultElement = document.createElement('div');
                    resultElement.className = 'search-result';
                    
                    const highlighted = highlightMatch(match.sentence, query);
                    
                    resultElement.innerHTML = `
                        <h3>${result.track.title} 
                            <small>${result.type === 'track' ? result.album.title : 'Single'}</small>
                        </h3>
                        ${match.prev ? `<p>${match.prev}</p>` : ''}
                        <p class="highlight">${highlighted}</p>
                        ${match.next ? `<p>${match.next}</p>` : ''}
                    `;
                    
                    resultElement.addEventListener('click', () => {
                        const url = result.type === 'track' 
                            ? `track.html?albumId=${result.album.id}&trackId=${result.track.id}`
                            : `track.html?trackId=${result.track.id}`;
                        window.location.href = url;
                    });
                    
                    resultsContainer.appendChild(resultElement);
                });
            });
        }
        
        albumsGrid.classList.add('hidden');
        searchResults.classList.remove('hidden');
    }

    // Funkcja zakreślająca znaleziony w wyszukiwarce tekst
    function highlightMatch(text, query) {
        const exactMatch = query.startsWith('"') && query.endsWith('"');
        const cleanQuery = exactMatch ? query.slice(1, -1) : query;
        const regex = new RegExp(`(${cleanQuery.split(' ').join('|')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
    // Przycisk powrotu do albumów
    backToAlbumsBtn.addEventListener('click', () => {
        searchResults.classList.add('hidden');
        albumsGrid.classList.remove('hidden');
        searchInput.value = '';
    });

    // Funkcja ustalająca format daty jako - rok
    function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
}

    // Czyszczenie cache przed wyjściem ze strony
    window.addEventListener('beforeunload', function() {
    localStorage.clear();
    sessionStorage.clear();
    })

    "use strict";
    window.addEventListener('load', function() {
    $("#preloader").delay(400).fadeOut("slow");
	$("#preloader .clock").fadeOut();
    });
});