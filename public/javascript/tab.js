window.addEventListener('load', function() {
    var tablist = document.querySelectorAll('.product-switch-list__item');
    if(tablist.length > 0) {

        for(var i= 0; i<tablist.length;i++) {
            tablist[i].addEventListener('click', function() {
                var tabId = this.getAttribute('data-tab');
                for(var j=0;j<tablist.length;j++){
                    tablist[j].classList.remove('active');
                    var tabId1 = tablist[j].getAttribute('data-tab');
                    document.getElementById(tabId1).classList.remove('active');
                }
                var tabContainer = document.getElementById(tabId);
                if(!tabContainer.classList.contains('active')) {
                    tabContainer.classList.add('active');
                }
                if(!this.classList.contains('active')) {
                    this.classList.add('active');
                }
            })
        }
    }
    var overlay = document.querySelector('.overlay-window');
    if(!(overlay === null)) {
        document.querySelector('.overlay-window ').addEventListener('click', function() {
            document.querySelector('.login-prompt').classList.remove('active');
        })
    }

    var slideIndex = 0;
    var slides = document.getElementsByClassName("mySlides");
    function showSlides() {
        var i;   
        for (i = 0; i < slides.length; i++)
           {
           slides[i].style.display = "none";  
           }
    
        slideIndex++;
        if (slideIndex > slides.length) {slideIndex = 1}     
        slides[slideIndex-1].style.display = "block";   
        setTimeout(showSlides, 4000);
    };
    if(slides.length > 0 ) {
        showSlides();
    }
})