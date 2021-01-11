import Vue from 'vue'
import App from './App.vue'

// element系
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/ja'

Vue.config.productionTip = false

// element
Vue.use(ElementUI, { locale });

new Vue({
  render: h => h(App),
}).$mount('#app')
