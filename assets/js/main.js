/* Goldbird site JS: nav, reveal, forms -> WhatsApp, lightbox */
(function(){
  'use strict';
  var WA_NUMBER = '918743930125'; // TODO: confirm WhatsApp number with client
  var EMAIL = 'servicesgoldbird@gmail.com';
  var doc = document.documentElement;
  doc.classList.add('js');

  /* Sticky header shadow */
  var header = document.querySelector('.header');
  function onScroll(){ if(header){ header.classList.toggle('scrolled', window.scrollY > 10); } }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Mobile nav */
  var nav = document.getElementById('site-nav');
  var scrim = document.querySelector('.scrim');
  var openBtn = document.querySelector('.menu-open');
  var closeBtn = document.querySelector('.nav-close');
  function setNav(open){
    if(!nav) return;
    nav.classList.toggle('open', open);
    if(scrim) scrim.classList.toggle('show', open);
    if(openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('nav-open', open);
  }
  if(openBtn) openBtn.addEventListener('click', function(){ setNav(true); });
  if(closeBtn) closeBtn.addEventListener('click', function(){ setNav(false); });
  if(scrim) scrim.addEventListener('click', function(){ setNav(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setNav(false); });
  document.querySelectorAll('.has-drop > button').forEach(function(btn){
    btn.addEventListener('click', function(){
      var li = btn.parentElement; var o = !li.classList.contains('open');
      li.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true':'false');
    });
  });
  document.addEventListener('click', function(e){
    document.querySelectorAll('.has-drop.open').forEach(function(li){
      if(!li.contains(e.target) && window.innerWidth > 960){ li.classList.remove('open'); }
    });
  });

  /* Reveal on scroll */
  var els = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }

  /* Forms -> WhatsApp message (no backend) */
  function cleanPhone(v){ return (v || '').replace(/[\s\-().]/g, ''); }
  function validPhone(v){ return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleanPhone(v)); }
  function labelFor(field){
    var id = field.id; var l = id ? document.querySelector('label[for="' + id + '"]') : null;
    return (field.getAttribute('data-label') || (l ? l.textContent : field.name)).replace('*','').trim();
  }
  document.querySelectorAll('form[data-wa-form]').forEach(function(form){
    var success = form.querySelector('.form-success');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('.field').forEach(function(f){ f.classList.remove('invalid'); });
      form.querySelectorAll('[required]').forEach(function(inp){
        if(!String(inp.value || '').trim()){ ok = false; inp.closest('.field').classList.add('invalid'); }
      });
      form.querySelectorAll('input[type="tel"]').forEach(function(inp){
        if(inp.value.trim() && !validPhone(inp.value)){ ok = false; inp.closest('.field').classList.add('invalid'); }
      });
      if(!ok){
        var first = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if(first) first.focus();
        return;
      }
      var title = form.getAttribute('data-wa-form') || 'Enquiry';
      var lines = ['Hello Goldbird, ' + (title === 'Job application' ? 'I would like to apply for a job.' : 'I would like a quote.'), '', '*' + title + '*'];
      Array.prototype.forEach.call(form.elements, function(el){
        if(!el.name || el.type === 'submit' || el.type === 'button') return;
        var v = String(el.value || '').trim(); if(!v) return;
        lines.push(labelFor(el) + ': ' + v);
      });
      lines.push('', 'Page: ' + document.title);
      var text = lines.join('\n');
      var waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      var mailUrl = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(title + ' - Goldbird website') + '&body=' + encodeURIComponent(text);
      window.open(waUrl, '_blank', 'noopener');
      if(success){
        success.innerHTML = '<strong>Thank you!</strong> WhatsApp should have opened in a new tab with your details. ' +
          'If it did not, <a href="' + waUrl + '" target="_blank" rel="noopener">open WhatsApp</a>, ' +
          '<a href="' + mailUrl + '">send the same details by email</a>, or call <a href="tel:+918743930125">+91-8743930125</a>.';
        success.classList.add('show');
      }
    });
    form.querySelectorAll('input,select,textarea').forEach(function(inp){
      inp.addEventListener('input', function(){ var f = inp.closest('.field'); if(f) f.classList.remove('invalid'); });
    });
  });

  /* Preselect service from ?service= */
  try{
    var sp = new URLSearchParams(location.search).get('service');
    if(sp){ document.querySelectorAll('select[name="service"]').forEach(function(s){
      Array.prototype.forEach.call(s.options, function(o){ if(o.value === sp) s.value = sp; });
    }); }
  }catch(err){}

  /* Gallery filters */
  var filterBtns = document.querySelectorAll('.filters button');
  filterBtns.forEach(function(b){
    b.addEventListener('click', function(){
      filterBtns.forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-pressed','false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed','true');
      var f = b.getAttribute('data-filter');
      document.querySelectorAll('.gal a').forEach(function(a){
        a.classList.toggle('hide', f !== 'all' && a.getAttribute('data-cat') !== f);
      });
    });
  });

  /* Lightbox */
  var lb = document.querySelector('.lb');
  if(lb){
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), idx = 0, items = [];
    function visible(){ return Array.prototype.filter.call(document.querySelectorAll('[data-lightbox]'), function(a){ return !a.classList.contains('hide'); }); }
    function show(i){
      items = visible(); if(!items.length) return;
      idx = (i + items.length) % items.length; var a = items[idx];
      lbImg.src = a.getAttribute('href'); lbImg.alt = a.querySelector('img').alt;
      lbCap.textContent = a.getAttribute('data-caption') || a.querySelector('img').alt;
    }
    function open(i){ show(i); lb.classList.add('open'); document.body.style.overflow='hidden'; lb.querySelector('.lb-close').focus(); }
    function close(){ lb.classList.remove('open'); document.body.style.overflow=''; }
    document.querySelectorAll('[data-lightbox]').forEach(function(a){
      a.addEventListener('click', function(e){ e.preventDefault(); open(visible().indexOf(a)); });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function(){ show(idx-1); });
    lb.querySelector('.lb-next').addEventListener('click', function(){ show(idx+1); });
    lb.addEventListener('click', function(e){ if(e.target === lb) close(); });
    document.addEventListener('keydown', function(e){
      if(!lb.classList.contains('open')) return;
      if(e.key === 'Escape') close(); if(e.key === 'ArrowLeft') show(idx-1); if(e.key === 'ArrowRight') show(idx+1);
    });
  }

  var y = document.getElementById('yr'); if(y) y.textContent = new Date().getFullYear();
})();
