import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button.vue";

describe("Button", () => {
  it("по умолчанию — type=button, чтобы не сабмитить форму случайно", () => {
    const wrapper = mount(Button, { slots: { default: "OK" } });
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.attributes("type")).toBe("button");
  });

  it("type можно переопределить через атрибут", () => {
    const wrapper = mount(Button, { attrs: { type: "submit" } });
    expect(wrapper.attributes("type")).toBe("submit");
  });

  it("disabled-кнопка не кликается", async () => {
    const onClick = vi.fn();
    const wrapper = mount(Button, { props: { disabled: true }, attrs: { onClick } });
    expect(wrapper.attributes("disabled")).toBeDefined();
    await wrapper.trigger("click");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading: aria-busy, disabled и декоративный спиннер", async () => {
    const onClick = vi.fn();
    const wrapper = mount(Button, { props: { loading: true }, attrs: { onClick } });
    expect(wrapper.attributes("aria-busy")).toBe("true");
    expect(wrapper.attributes("disabled")).toBeDefined();
    expect(wrapper.find(".ui-button__spinner").attributes("aria-hidden")).toBe("true");
    await wrapper.trigger("click");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("в обычном состоянии нет aria-busy/aria-disabled", () => {
    const wrapper = mount(Button);
    expect(wrapper.attributes("aria-busy")).toBeUndefined();
    expect(wrapper.attributes("aria-disabled")).toBeUndefined();
    expect(wrapper.attributes("disabled")).toBeUndefined();
  });

  describe("иконки", () => {
    const icon = '<svg data-testid="icon" viewBox="0 0 24 24"></svg>';

    it("рендерит start/end вокруг лейбла, скрытыми от скринридера", () => {
      const wrapper = mount(Button, { slots: { start: icon, default: "OK", end: icon } });
      const parts = wrapper.findAll(".ui-button > span").map((el) => el.classes()[0]);
      expect(parts).toEqual(["ui-button__icon", "ui-button__label", "ui-button__icon"]);
      for (const el of wrapper.findAll(".ui-button__icon")) {
        expect(el.attributes("aria-hidden")).toBe("true");
      }
    });

    it("без слотов обёрток иконок нет", () => {
      const wrapper = mount(Button, { slots: { default: "OK" } });
      expect(wrapper.find(".ui-button__icon").exists()).toBe(false);
    });

    it("в loading иконки скрыты — только спиннер, как в Figma", () => {
      const wrapper = mount(Button, {
        props: { loading: true },
        slots: { start: icon, default: "OK", end: icon },
      });
      expect(wrapper.find(".ui-button__icon").exists()).toBe(false);
      expect(wrapper.find(".ui-button__spinner").exists()).toBe(true);
    });
  });

  describe("блик нажатия", () => {
    it("pointerdown запоминает точку касания в % для блика", async () => {
      const wrapper = mount(Button, { slots: { default: "OK" } });
      const el = wrapper.element as HTMLElement;
      el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 50 }) as DOMRect;
      el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 50, clientY: 25, bubbles: true }));
      await wrapper.vm.$nextTick();
      expect(el.style.getPropertyValue("--_press-x")).toBe("25%");
      expect(el.style.getPropertyValue("--_press-y")).toBe("50%");
    });

    it("нажатие с клавиатуры сбрасывает точку — блик из центра", async () => {
      const wrapper = mount(Button, { slots: { default: "OK" } });
      const el = wrapper.element as HTMLElement;
      el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;
      el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 10, clientY: 10, bubbles: true }));
      await wrapper.trigger("keydown", { key: " " });
      expect(el.style.getPropertyValue("--_press-x")).toBe("");
    });
  });

  describe('as="a"', () => {
    it("рендерит ссылку без type/disabled", () => {
      const wrapper = mount(Button, { props: { as: "a" }, attrs: { href: "/x" } });
      expect(wrapper.element.tagName).toBe("A");
      expect(wrapper.attributes("href")).toBe("/x");
      expect(wrapper.attributes("type")).toBeUndefined();
      expect(wrapper.attributes("disabled")).toBeUndefined();
    });

    it("disabled-ссылка: aria-disabled и клик гасится", async () => {
      const onClick = vi.fn();
      const wrapper = mount(Button, {
        props: { as: "a", disabled: true },
        attrs: { href: "/x", onClick },
      });
      expect(wrapper.attributes("aria-disabled")).toBe("true");
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      wrapper.element.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("активная ссылка кликается", async () => {
      const onClick = vi.fn();
      const wrapper = mount(Button, { props: { as: "a" }, attrs: { href: "#", onClick } });
      await wrapper.trigger("click");
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
