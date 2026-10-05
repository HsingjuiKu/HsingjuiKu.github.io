// Branch forecasts off the main thread (a branch comparison is ~75 convolution steps of the spatial world model).
import { parseBin, MainModel, SpatialModel, forecast } from './lens_models.js';

let main = null, spatial = null;
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'init') {
      const m = parseBin(data.buffer);
      main = new MainModel(m, data.scales);
      spatial = new SpatialModel(m);
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'forecast') {
      self.postMessage({ type: 'forecast', id: data.id, branches: forecast(main, spatial, data.history, data.actions, data.agentsFuture) });
    }
  } catch (e) {
    self.postMessage({ type: 'error', id: data.id, message: String(e && e.message || e) });
  }
};
