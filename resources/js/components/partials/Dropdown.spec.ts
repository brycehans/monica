import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Dropdown from './Dropdown.vue';

describe('Dropdown', () => {
  it('renders closed initially (no .show class on root or menu)', () => {
    const wrapper = mount(Dropdown, {
      attachTo: document.body,
      props: { label: 'Sort', triggerId: 'sortTrigger' },
      slots: { default: '<a class="dropdown-item" href="#">A</a>' },
    });

    expect(wrapper.classes()).toContain('dropdown');
    expect(wrapper.classes()).not.toContain('show');
    expect(wrapper.find('.dropdown-menu').classes()).not.toContain('show');
    expect(wrapper.find('.dropdown-btn').attributes('aria-expanded')).toBe('false');
  });

  it('opens on trigger click and toggles closed on a second click', async () => {
    const wrapper = mount(Dropdown, {
      attachTo: document.body,
      props: { label: 'Sort' },
    });

    await wrapper.find('.dropdown-btn').trigger('click');
    expect(wrapper.classes()).toContain('show');
    expect(wrapper.find('.dropdown-menu').classes()).toContain('show');
    expect(wrapper.find('.dropdown-btn').attributes('aria-expanded')).toBe('true');

    await wrapper.find('.dropdown-btn').trigger('click');
    expect(wrapper.classes()).not.toContain('show');
    expect(wrapper.find('.dropdown-menu').classes()).not.toContain('show');
  });

  it('closes when a menu item is clicked (click bubbles to .dropdown-menu)', async () => {
    const wrapper = mount(Dropdown, {
      attachTo: document.body,
      props: { label: 'Sort' },
      slots: { default: '<a class="dropdown-item" href="#item">Item</a>' },
    });

    await wrapper.find('.dropdown-btn').trigger('click');
    expect(wrapper.classes()).toContain('show');

    await wrapper.find('.dropdown-item').trigger('click');
    expect(wrapper.classes()).not.toContain('show');
  });

  it('closes on outside click', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    const wrapper = mount(Dropdown, {
      attachTo: document.body,
      props: { label: 'Sort' },
    });

    await wrapper.find('.dropdown-btn').trigger('click');
    expect(wrapper.classes()).toContain('show');

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).not.toContain('show');

    outside.remove();
  });

  it('does NOT close when clicking the trigger itself (outside-click guard skips contained targets)', async () => {
    const wrapper = mount(Dropdown, {
      attachTo: document.body,
      props: { label: 'Sort' },
    });

    await wrapper.find('.dropdown-btn').trigger('click');
    expect(wrapper.classes()).toContain('show');

    // A second native click on the trigger goes through onDocumentClick AND the
    // trigger's own @click. The contains() guard skips the document handler,
    // and the trigger toggles to closed exactly once.
    wrapper.find('.dropdown-btn').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).not.toContain('show');
  });

  it('renders custom trigger slot content when provided', () => {
    const wrapper = mount(Dropdown, {
      attachTo: document.body,
      slots: {
        trigger: '<span class="custom-trigger">Custom</span>',
        default: '',
      },
    });

    expect(wrapper.find('.dropdown-btn .custom-trigger').exists()).toBe(true);
    expect(wrapper.find('.dropdown-btn').text()).toContain('Custom');
  });
});
