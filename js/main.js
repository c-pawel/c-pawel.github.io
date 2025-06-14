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
            // Cache'owanie danych
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
            albumCard.className = 'album-card';
            albumCard.innerHTML = `
                <img src="images/${album.cover}" alt="${album.title}" class="album-cover">
                <h3>${album.title}</h3>
                <p>${formatDate(album.release_date)}</p>
                <p>${album.tracks.length} utworów</p>
            `;
            albumCard.addEventListener('click', () => {
                window.location.href = `album.html?id=${album.id}`;
            });
            albumsGrid.appendChild(albumCard);
        });
        
        // Album "Inne"
        if (otherTracks.length > 0) {
            const otherCard = document.createElement('div');
            otherCard.className = 'album-card';
            otherCard.innerHTML = `
                <img src="images/single.jpg" alt="Single" class="album-cover">
                <h3>Single</h3>
                <p>2008-2025<p>
                <p>${otherTracks.length} utworów</p>
            `;
            otherCard.addEventListener('click', () => {
                window.location.href = 'album.html?other=true';
            });
            albumsGrid.appendChild(otherCard);
        }
    }

    // Wyszukiwarka
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        const results = searchLyrics(query, discography);
        displaySearchResults(results, query);
    }

    function searchLyrics(query, data) {
        const results = [];
        const exactMatch = query.startsWith('"') && query.endsWith('"');
        const cleanQuery = exactMatch ? query.slice(1, -1) : query;
        const regex = new RegExp(exactMatch ? cleanQuery : cleanQuery.split(' ').join('|'), 'i');
        
        // Szukaj w albumach
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
        
        // Szukaj w innych utworach
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

    function cleanText(text) {
        return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();
    }

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

    function highlightMatch(text, query) {
        const exactMatch = query.startsWith('"') && query.endsWith('"');
        const cleanQuery = exactMatch ? query.slice(1, -1) : query;
        const regex = new RegExp(`(${cleanQuery.split(' ').join('|')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    backToAlbumsBtn.addEventListener('click', () => {
        searchResults.classList.add('hidden');
        albumsGrid.classList.remove('hidden');
        searchInput.value = '';
    });

    function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
}

    window.addEventListener('beforeunload', function() {
    localStorage.clear();
    sessionStorage.clear();
    })
});