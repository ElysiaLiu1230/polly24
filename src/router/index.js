import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../views/StartView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Start',
      component: StartView
    },
      {
      path: '/poll/:id',
      name: 'PollView',
      component: () => import('../views/PollView.vue')
    },
    {
      path: '/lobby/:id',
      name: 'LobbyView',
      component: () => import('../views/LobbyView.vue')
    },
    {
      path: '/host/:id',
      name: 'HostView',
      component: () => import('../views/HostView.vue')
    },
    {
      path: '/create/',
      name: 'CreateView',
      component: () => import('../views/CreateView.vue')
    },
    {
      path: '/question-result/:id',
      name: 'questionResult',
      component: () => import('../views/QuestionResultView.vue')
    },
    {
      path: '/final-result/:id',
      name: 'finalResult',
      component: () => import('../views/FinalResultView.vue')
    }
  ]
})

export default router
