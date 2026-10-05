// Tiny lil-gui-style panel (no dependencies): folders, sliders, checkboxes, selects, colors, buttons.

const CSS = `
.lg-root{position:fixed;top:0;right:15px;width:245px;font:11px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#ebebeb;background:#1f1f1f;z-index:20;user-select:none;max-height:100vh;overflow-y:auto;scrollbar-width:thin}
.lg-title{background:#111;padding:0 8px;height:27px;line-height:27px;font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px}
.lg-title .lg-arrow{display:inline-block;width:10px;transition:transform .12s;font-size:11px;opacity:.9}
.lg-open>.lg-title .lg-arrow{transform:rotate(90deg)}
.lg-children{display:none}
.lg-open>.lg-children{display:block}
.lg-folder>.lg-title{background:#1f1f1f;border-top:1px solid #2c2c2c;font-weight:600;font-size:11px;height:24px;line-height:24px}
.lg-folder .lg-children{padding-left:6px;border-left:2px solid #2c2c2c;margin-left:4px}
.lg-row{display:flex;align-items:center;height:24px;padding:0 8px;gap:6px}
.lg-row label{flex:0 0 40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ebebeb}
.lg-row .lg-w{flex:1;display:flex;align-items:center;gap:5px;min-width:0}
.lg-slider{flex:1;height:18px;background:#424242;border-radius:2px;position:relative;cursor:ew-resize}
.lg-slider .lg-fill{position:absolute;left:0;top:0;bottom:0;background:#2cc9ff;border-radius:2px;opacity:.85}
.lg-num{width:46px;background:#424242;border:0;color:#2cc9ff;font:inherit;height:18px;padding:0 4px;border-radius:2px}
.lg-num:focus{outline:1px solid #2cc9ff}
.lg-row input[type=checkbox]{accent-color:#2cc9ff;margin:0}
.lg-row select{flex:1;background:#424242;color:#ebebeb;border:0;height:18px;font:inherit;border-radius:2px}
.lg-row input[type=color]{width:100%;height:18px;border:0;padding:0;background:#424242}
.lg-btn{width:100%;background:#424242;border:0;color:#ebebeb;font:inherit;height:20px;border-radius:2px;cursor:pointer;text-align:left;padding:0 8px}
.lg-btn:hover{background:#4f4f4f}
.lg-text{color:#9a9a9a;padding:2px 8px 6px;white-space:pre-wrap;font-size:10.5px}
`;

let styled = false;

class Controller {
  constructor(folder, obj, prop, row) {
    this.folder = folder;
    this.obj = obj;
    this.prop = prop;
    this.row = row;
    this._onChange = null;
  }
  onChange(fn) {
    this._onChange = fn;
    return this;
  }
  fire() {
    this._onChange && this._onChange(this.obj[this.prop]);
  }
  name(n) {
    this.row.querySelector('label').textContent = n;
    return this;
  }
}

export class GUI {
  constructor({ title = 'Controls', parent = document.body, open = false, _folder = false } = {}) {
    if (!styled) {
      const st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);
      styled = true;
    }
    this.el = document.createElement('div');
    this.el.className = _folder ? 'lg-folder' : 'lg-root';
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'lg-title';
    this.titleEl.innerHTML = `<span class="lg-arrow">›</span><span></span>`;
    this.titleEl.lastChild.textContent = title;
    this.children = document.createElement('div');
    this.children.className = 'lg-children';
    this.el.append(this.titleEl, this.children);
    this.titleEl.addEventListener('click', () => this.el.classList.toggle('lg-open'));
    if (open) this.el.classList.add('lg-open');
    parent.appendChild(this.el);
    this.controllers = [];
    this.el.addEventListener('keydown', (e) => e.stopPropagation());
  }

  addFolder(title, open = false) {
    const f = new GUI({ title, parent: this.children, open, _folder: true });
    this.controllers.push(f);
    return f;
  }

  _row(label) {
    const row = document.createElement('div');
    row.className = 'lg-row';
    const l = document.createElement('label');
    l.textContent = label;
    const w = document.createElement('div');
    w.className = 'lg-w';
    row.append(l, w);
    this.children.appendChild(row);
    return [row, w];
  }

  add(obj, prop, a, b, c) {
    const v = obj[prop];
    if (typeof v === 'function') return this._button(obj, prop);
    if (typeof v === 'boolean') return this._bool(obj, prop);
    if (Array.isArray(a)) return this._select(obj, prop, a);
    if (typeof v === 'number') return this._number(obj, prop, a, b, c);
    throw new Error('GUI: unsupported ' + prop);
  }

  _number(obj, prop, min = 0, max = 1, step = 0.01) {
    const [row, w] = this._row(prop);
    const sl = document.createElement('div');
    sl.className = 'lg-slider';
    const fill = document.createElement('div');
    fill.className = 'lg-fill';
    sl.appendChild(fill);
    const num = document.createElement('input');
    num.className = 'lg-num';
    w.append(sl, num);
    const ctl = new Controller(this, obj, prop, row);
    const decimals = Math.max(0, Math.min(4, -Math.floor(Math.log10(step) + 1e-9)));
    const render = () => {
      const val = obj[prop];
      fill.style.width = `${(100 * (val - min)) / (max - min)}%`;
      if (document.activeElement !== num) num.value = val.toFixed(decimals);
    };
    const set = (val) => {
      val = Math.min(max, Math.max(min, Math.round(val / step) * step));
      obj[prop] = +val.toFixed(6);
      render();
      ctl.fire();
    };
    const fromEvent = (e) => {
      const r = sl.getBoundingClientRect();
      set(min + ((e.clientX - r.left) / r.width) * (max - min));
    };
    sl.addEventListener('pointerdown', (e) => {
      sl.setPointerCapture(e.pointerId);
      fromEvent(e);
      const mv = (ev) => fromEvent(ev);
      const up = () => {
        sl.removeEventListener('pointermove', mv);
        sl.removeEventListener('pointerup', up);
      };
      sl.addEventListener('pointermove', mv);
      sl.addEventListener('pointerup', up);
    });
    num.addEventListener('change', () => {
      const x = parseFloat(num.value);
      if (!isNaN(x)) set(x);
    });
    ctl.updateDisplay = render;
    render();
    this.controllers.push(ctl);
    return ctl;
  }

  _bool(obj, prop) {
    const [row, w] = this._row(prop);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = obj[prop];
    w.appendChild(cb);
    const ctl = new Controller(this, obj, prop, row);
    cb.addEventListener('change', () => {
      obj[prop] = cb.checked;
      ctl.fire();
    });
    ctl.updateDisplay = () => (cb.checked = obj[prop]);
    this.controllers.push(ctl);
    return ctl;
  }

  _select(obj, prop, options) {
    const [row, w] = this._row(prop);
    const s = document.createElement('select');
    for (const o of options) {
      const op = document.createElement('option');
      op.value = op.textContent = o;
      s.appendChild(op);
    }
    s.value = obj[prop];
    w.appendChild(s);
    const ctl = new Controller(this, obj, prop, row);
    s.addEventListener('change', () => {
      obj[prop] = s.value;
      ctl.fire();
    });
    ctl.updateDisplay = () => (s.value = obj[prop]);
    this.controllers.push(ctl);
    return ctl;
  }

  addColor(obj, prop) {
    const [row, w] = this._row(prop);
    const c = document.createElement('input');
    c.type = 'color';
    c.value = obj[prop];
    w.appendChild(c);
    const ctl = new Controller(this, obj, prop, row);
    c.addEventListener('input', () => {
      obj[prop] = c.value;
      ctl.fire();
    });
    ctl.updateDisplay = () => (c.value = obj[prop]);
    this.controllers.push(ctl);
    return ctl;
  }

  _button(obj, prop) {
    const row = document.createElement('div');
    row.className = 'lg-row';
    const b = document.createElement('button');
    b.className = 'lg-btn';
    b.textContent = prop;
    row.appendChild(b);
    this.children.appendChild(row);
    const ctl = new Controller(this, obj, prop, row);
    ctl.name = (n) => {
      b.textContent = n;
      return ctl;
    };
    b.addEventListener('click', () => obj[prop]());
    ctl.updateDisplay = () => {};
    this.controllers.push(ctl);
    return ctl;
  }

  addText(text) {
    const d = document.createElement('div');
    d.className = 'lg-text';
    d.textContent = text;
    this.children.appendChild(d);
    return { set: (t) => (d.textContent = t), el: d };
  }

  updateDisplay() {
    for (const c of this.controllers) c.updateDisplay && c.updateDisplay();
  }
}
