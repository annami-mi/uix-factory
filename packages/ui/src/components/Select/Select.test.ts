import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import Select, { type SelectOption } from "./Select.vue";

const options: SelectOption[] = [
  { value: "ru", label: "Россия" },
  { value: "kz", label: "Казахстан" },
  { value: "by", label: "Беларусь", disabled: true },
];

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Select", () => {
  it("подпись связана с триггером, ошибка — через aria-describedby и aria-invalid", () => {
    const wrapper = mount(Select, {
      props: { options, label: "Страна", error: "Выберите страну", presentation: "popover" },
    });
    const trigger = wrapper.get("[data-field-control]");
    expect(wrapper.get("label").attributes("for")).toBe(trigger.attributes("id"));
    expect(trigger.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get(`#${trigger.attributes("aria-describedby")}`).text()).toBe("Выберите страну");
  });

  it("показывает плейсхолдер, пока ничего не выбрано, и подпись выбранной опции", async () => {
    const wrapper = mount(Select, { props: { options, placeholder: "Выберите", presentation: "popover" } });
    const trigger = wrapper.get("[data-field-control]");
    expect(trigger.text()).toBe("Выберите");
    expect(trigger.attributes("data-empty")).toBeDefined();
    await wrapper.setProps({ modelValue: "kz" });
    expect(trigger.text()).toBe("Казахстан");
    expect(trigger.attributes("data-empty")).toBeUndefined();
  });

  it("disabled и loading блокируют триггер; loading — aria-busy и спиннер", () => {
    for (const state of [{ disabled: true }, { loading: true }]) {
      const wrapper = mount(Select, { props: { options, presentation: "popover" as const, ...state } });
      expect(wrapper.get("[data-field-control]").attributes("disabled")).toBeDefined();
    }
    const loading = mount(Select, { props: { options, presentation: "popover", loading: true } });
    expect(loading.get("[data-field-control]").attributes("aria-busy")).toBe("true");
    expect(loading.find(".ui-spinner").exists()).toBe(true);
  });

  describe("шторка", () => {
    it("триггер — кнопка диалога; выбор опции обновляет значение и закрывает шторку", async () => {
      const wrapper = mount(Select, {
        attachTo: document.body,
        props: {
          options,
          label: "Страна",
          presentation: "sheet" as const,
          "onUpdate:modelValue": (v: string | undefined) => wrapper.setProps({ modelValue: v }),
        },
      });
      const trigger = wrapper.get("[data-field-control]");
      expect(trigger.attributes("aria-haspopup")).toBe("dialog");
      expect(trigger.attributes("aria-expanded")).toBe("false");

      await trigger.trigger("click");
      await flushPromises();
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain("Страна");

      const option = [...document.querySelectorAll('[role="option"]')].find((el) => el.textContent?.includes("Казахстан"));
      (option as HTMLElement).click();
      await flushPromises();

      expect(wrapper.props("modelValue")).toBe("kz");
      expect(trigger.text()).toBe("Казахстан");
      expect(trigger.attributes("aria-expanded")).toBe("false");
      wrapper.unmount();
    });

    it("с name отдаёт значение в форму через скрытый input", () => {
      const wrapper = mount(Select, { props: { options, name: "country", modelValue: "ru", presentation: "sheet" } });
      const hidden = wrapper.get('input[type="hidden"]');
      expect(hidden.attributes("name")).toBe("country");
      expect((hidden.element as HTMLInputElement).value).toBe("ru");
    });
  });
});
