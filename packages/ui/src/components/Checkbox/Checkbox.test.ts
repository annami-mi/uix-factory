import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Checkbox from "./Checkbox.vue";

const input = (w: ReturnType<typeof mount>) => w.get('input[type="checkbox"]');

describe("Checkbox", () => {
  it("v-model: клик по подписи переключает флажок", async () => {
    const wrapper = mount(Checkbox, {
      attachTo: document.body,
      props: { label: "Согласен с условиями", modelValue: false, "onUpdate:modelValue": (v: boolean) => wrapper.setProps({ modelValue: v }) },
    });
    await wrapper.get("label").trigger("click");
    expect(wrapper.props("modelValue")).toBe(true);
    expect((input(wrapper).element as HTMLInputElement).checked).toBe(true);
    expect(wrapper.find(".ui-checkbox__mark").exists()).toBe(true);
    wrapper.unmount();
  });

  it("подпись — доступное имя флажка", () => {
    const wrapper = mount(Checkbox, { props: { label: "Подписаться" } });
    expect(wrapper.get("label").attributes("for")).toBe(input(wrapper).attributes("id"));
  });

  it("indeterminate — DOM-свойство и черта вместо галочки", () => {
    const wrapper = mount(Checkbox, { props: { label: "Выбрать всё", indeterminate: true } });
    expect((input(wrapper).element as HTMLInputElement).indeterminate).toBe(true);
    expect(wrapper.find(".ui-checkbox__mark").exists()).toBe(true);
  });

  it("описание не входит в <label> (иначе попадёт и в имя, и в описание)", () => {
    const wrapper = mount(Checkbox, { props: { label: "Согласен", description: "Условия доставки" } });
    expect(wrapper.get("label").text()).toBe("Согласен");
  });

  it("описание и ошибка связаны через aria-describedby, ошибка ставит aria-invalid", () => {
    const wrapper = mount(Checkbox, { props: { label: "Согласен", description: "Условия доставки", error: "Нужно согласие" } });
    const el = input(wrapper);
    expect(el.attributes("aria-invalid")).toBe("true");
    const texts = el.attributes("aria-describedby")!.split(" ").map((id) => wrapper.get(`#${id}`).text());
    expect(texts).toEqual(["Условия доставки", "Нужно согласие"]);
  });

  it("disabled; name/value уходят на <input>", () => {
    const wrapper = mount(Checkbox, { props: { label: "x", disabled: true }, attrs: { name: "terms", value: "yes" } });
    expect(input(wrapper).attributes("disabled")).toBeDefined();
    expect(input(wrapper).attributes("name")).toBe("terms");
    expect(input(wrapper).attributes("value")).toBe("yes");
  });
});
