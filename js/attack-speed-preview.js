/* Model tốc đánh: dữ liệu đọc trực tiếp từ game-data/attack-speed-models.json.
   Tính năng chỉ hiển thị bảng mốc; KHÔNG tính % tốc đánh nhập tay. */
(() => {
  'use strict';
  const $ = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const format = (value) => String(value).replace('.', ',');

  async function render() {
    const container = document.getElementById('hero-content');
    if (!container || container.querySelector('.attack-speed-panel')) return;
    const heroId = new URLSearchParams(location.search).get('id');
    const hero = typeof getHeroById === 'function' && getHeroById(heroId);
    if (!hero) return;

    const section = $('section', 'attack-speed-panel');
    const header = $('div', 'attack-speed-heading');
    header.append($('h3', '', 'Model tốc đánh'));
    const source = $('p', 'attack-speed-source', 'Dữ liệu từ bảng tham khảo; có thể khác phiên bản game hiện tại.');
    const body = $('div', 'attack-speed-body');
    section.append(header, body, source);
    const tabs = container.querySelector('.hero-page-tabs');
    if (tabs) tabs.insertAdjacentElement('afterend', section);
    else container.appendChild(section);

    let data;
    try {
      const response = await fetch('game-data/attack-speed-models.json', {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
      if (!data || !data.models || !data.heroes) throw new Error('JSON không hợp lệ');
    } catch (error) {
      body.append($('p','attack-speed-muted','Không tải được dữ liệu Model tốc đánh.'));
      console.warn('LQG attack-speed:', error);
      return;
    }
    // Không gán Model C cho tướng chưa được xác minh.
    const forms = Array.isArray(data.heroes[hero.id]) ? data.heroes[hero.id] : [];
    if (!forms.length) {
      body.append($('p','attack-speed-muted','Chưa xác minh Model tốc đánh của tướng này.'));
      return;
    }

    const formButtons = $('div','attack-speed-forms');
    const content = $('div','attack-speed-detail');
    body.append(formButtons,content);
    function showForm(form,index) {
      [...formButtons.children].forEach((button,i)=>{
        button.classList.toggle('active', i===index);
        button.setAttribute('aria-pressed', String(i===index));
      });
      content.replaceChildren();
      const model = form.model && Object.hasOwn(data.models,form.model) ? form.model : null;
      const info = $('div','attack-speed-model-info');
      info.append($('strong','',model ? `Model ${model}` : 'Chưa có Model tiêu chuẩn'));
      content.append(info);
      if (form.note) content.append($('p','attack-speed-muted',form.note));
      if (!model) {
        if (!form.note) content.append($('p','attack-speed-muted','Trạng thái này chưa được xác minh.'));
        return;
      }
      const all = data.models[model];
      if (!Array.isArray(all) || !all.length) {
        content.append($('p','attack-speed-muted','Chưa có mốc Breakpoint cho Model này.'));
        return;
      }
      const table = $('table','attack-speed-table');
      const thead = $('thead');
      const thRow = $('tr');
      ['% tốc đánh','Đòn/giây','Frame'].forEach(title => thRow.append($('th','',title)));
      thead.append(thRow);
      const tbody = $('tbody');
      table.append(thead,tbody);
      const toggle = $('button','attack-speed-expand');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded','false');
      let expanded = false;
      const previews = new Set([0,Math.floor((all.length-1)*.25),Math.floor((all.length-1)*.5),Math.floor((all.length-1)*.75),all.length-1]);
      function updateRows() {
        tbody.replaceChildren();
        all.forEach((entry,i)=>{
          if (!expanded && all.length > 5 && !previews.has(i)) return;
          const tr = $('tr');
          tr.append($('td','',`${format(entry.percent)}%`));
          tr.append($('td','',`${Number(entry.attacksPerSecond).toFixed(2).replace('.',',')} đ/s`));
          tr.append($('td','',String(entry.frame)));
          tbody.append(tr);
        });
        toggle.textContent = expanded ? 'Thu gọn ▲' : `Xem tất cả ${all.length} mốc ▼`;
        toggle.setAttribute('aria-expanded',String(expanded));
      }
      content.append(table);
      if (all.length > 5) {
        content.append(toggle);
        toggle.addEventListener('click',()=>{expanded=!expanded;updateRows();});
      }
      updateRows();
    }
    if (forms.length > 1) {
      forms.forEach((form,index)=>{
        const button=$('button','attack-speed-form-button',form.name||`Trạng thái ${index+1}`);
        button.type='button';
        button.addEventListener('click',()=>showForm(form,index));
        formButtons.append(button);
      });
    } else {
      formButtons.append($('span','attack-speed-form-label',forms[0].name||'Mặc định'));
    }
    showForm(forms[0],0);
  }
  // Loader phát sự kiện sau khi JSON và giao diện tướng đã sẵn sàng.
  document.addEventListener('lqg:data-ready',render,{once:true});
})();
