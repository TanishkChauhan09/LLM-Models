document.querySelectorAll('nav ul li a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add a simple effect for the hero button to scroll to courses section
document.querySelector('.hero .btn').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector('#courses').scrollIntoView({
        behavior: 'smooth'
    });
});