import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Input from "./Input.vue";

const control = (wrapper: ReturnType<typeof mount>) => wrapper.get("input");

describe("Input", () => {
  it("v-model: ввод обновляет значение", async () => {
    const wrapper = mount(Input, { props: { modelValue: "", "onUpdate:modelValue": (v: string) => wrapper.setProps({ modelValue: v }) } });
    await control(wrapper).setValue("привет");
    expect(wrapper.props("modelValue")).toBe("привет");
  });

  it("подпись связана с полем через for/id", () => {
    const wrapper = mount(Input, { props: { label: "Email" } });
    const label = wrapper.get("label");
    expect(label.text()).toBe("Email");
    expect(label.attributes("for")).toBe(control(wrapper).attributes("id"));
  });

  it("подсказка связана через aria-describedby", () => {
    const wrapper = mount(Input, { props: { label: "Email", hint: "Не публикуем" } });
    const describedBy = control(wrapper).attributes("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(wrapper.get(`#${describedBy}`).text()).toBe("Не публикуем");
  });

  it("ошибка заменяет подсказку и ставит aria-invalid", () => {
    const wrapper = mount(Input, { props: { label: "Email", hint: "Не публикуем", error: "Неверный email" } });
    const input = control(wrapper);
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get(`#${input.attributes("aria-describedby")}`).text()).toBe("Неверный email");
    expect(wrapper.text()).not.toContain("Не публикуем");
    expect(wrapper.find(".ui-field").attributes("data-invalid")).toBeDefined();
  });

  it("без ошибки нет aria-invalid", () => {
    const wrapper = mount(Input, { props: { label: "Email" } });
    expect(control(wrapper).attributes("aria-invalid")).toBeUndefined();
  });

  it("атрибуты уходят на <input>, class — на корень", () => {
    const wrapper = mount(Input, { attrs: { name: "email", autocomplete: "email", class: "extra" } });
    expect(control(wrapper).attributes("name")).toBe("email");
    expect(control(wrapper).attributes("autocomplete")).toBe("email");
    expect(wrapper.classes()).toContain("extra");
    expect(control(wrapper).classes()).not.toContain("extra");
  });

  it("disabled: нативный disabled", () => {
    const wrapper = mount(Input, { props: { disabled: true } });
    expect(control(wrapper).attributes("disabled")).toBeDefined();
  });

  it("loading: readonly, aria-busy и спиннер", () => {
    const wrapper = mount(Input, { props: { loading: true } });
    expect(control(wrapper).attributes("readonly")).toBeDefined();
    expect(control(wrapper).attributes("aria-busy")).toBe("true");
    expect(wrapper.find(".ui-spinner").exists()).toBe(true);
  });

  describe("clearable", () => {
    it("кнопки нет, пока поле пустое", () => {
      const wrapper = mount(Input, { props: { clearable: true, modelValue: "" } });
      expect(wrapper.find("button").exists()).toBe(false);
    });

    it("очищает значение, эмитит clear и возвращает фокус в поле", async () => {
      const wrapper = mount(Input, {
        attachTo: document.body,
        props: { clearable: true, modelValue: "текст", "onUpdate:modelValue": (v: string) => wrapper.setProps({ modelValue: v }) },
      });
      const button = wrapper.get("button");
      expect(button.attributes("aria-label")).toBe("Очистить");
      await button.trigger("click");
      expect(wrapper.props("modelValue")).toBe("");
      expect(wrapper.emitted("clear")).toHaveLength(1);
      expect(document.activeElement).toBe(control(wrapper).element);
      wrapper.unmount();
    });

    it("в disabled и loading кнопки нет", () => {
      for (const state of [{ disabled: true }, { loading: true }]) {
        const wrapper = mount(Input, { props: { clearable: true, modelValue: "текст", ...state } });
        expect(wrapper.find(".ui-input__clear").exists()).toBe(false);
      }
    });
  });
});
