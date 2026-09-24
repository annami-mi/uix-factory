import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Textarea from "./Textarea.vue";

describe("Textarea", () => {
  it("v-model и связь подписи с полем", async () => {
    const wrapper = mount(Textarea, {
      props: { label: "Комментарий", modelValue: "", "onUpdate:modelValue": (v: string) => wrapper.setProps({ modelValue: v }) },
    });
    const field = wrapper.get("textarea");
    expect(wrapper.get("label").attributes("for")).toBe(field.attributes("id"));
    await field.setValue("Позвоните после 18:00");
    expect(wrapper.props("modelValue")).toBe("Позвоните после 18:00");
  });

  it("ошибка: aria-invalid и описание", () => {
    const wrapper = mount(Textarea, { props: { label: "Комментарий", error: "Слишком коротко" } });
    const field = wrapper.get("textarea");
    expect(field.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get(`#${field.attributes("aria-describedby")}`).text()).toBe("Слишком коротко");
  });

  it("maxlength: нативный предел, счётчик и лимит в описании для скринридера", () => {
    const wrapper = mount(Textarea, { props: { label: "Отзыв", hint: "Коротко", maxlength: 200, modelValue: "Отлично" } });
    const field = wrapper.get("textarea");
    expect(field.attributes("maxlength")).toBe("200");
    expect(wrapper.get(".ui-form-field__aside").text()).toBe("7 / 200");
    const ids = field.attributes("aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
    expect(ids.map((id) => wrapper.get(`#${id}`).text())).toEqual(["Коротко", "Не больше 200 символов"]);
  });

  it("без maxlength счётчика нет", () => {
    const wrapper = mount(Textarea, { props: { label: "Отзыв" } });
    expect(wrapper.find(".ui-form-field__aside").exists()).toBe(false);
  });

  it("rows и maxRows задают высоту через CSS-переменные; autoResize=false — ручной resize", () => {
    const auto = mount(Textarea, { props: { rows: 4, maxRows: 8 } });
    expect(auto.get("textarea").attributes("style")).toContain("--_rows: 4");
    expect(auto.get("textarea").attributes("style")).toContain("--_max-rows: 8");
    expect(auto.get("textarea").attributes("data-autoresize")).toBeDefined();
    const fixed = mount(Textarea, { props: { rows: 4, autoResize: false } });
    expect(fixed.get("textarea").attributes("data-autoresize")).toBeUndefined();
    expect(fixed.get("textarea").attributes("style")).toContain("--_max-rows: 4");
  });

  it("disabled и атрибуты на <textarea>", () => {
    const wrapper = mount(Textarea, { props: { disabled: true }, attrs: { name: "comment", class: "extra" } });
    expect(wrapper.get("textarea").attributes("disabled")).toBeDefined();
    expect(wrapper.get("textarea").attributes("name")).toBe("comment");
    expect(wrapper.classes()).toContain("extra");
  });
});
