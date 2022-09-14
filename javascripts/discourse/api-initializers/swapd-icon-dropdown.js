import { apiInitializer } from "discourse/lib/api";
import { wantsNewWindow } from "discourse/lib/intercept-click";
import { createWidget } from "discourse/widgets/widget";
import RawHtml from "discourse/widgets/raw-html";
import { h } from "virtual-dom";
import { iconNode } from "discourse-common/lib/icon-library";
import { attachAdditionalPanel } from "discourse/widgets/header";
import Composer from "discourse/models/composer";

let widget;

const dropdown = {
  buildClasses(attrs) {
    let classes = ["btn-flat"];
    if (widget.state.swapdDropDownVisible) {
      classes.push("active");
    }

    return classes;
  },

  click(e) {
    if (wantsNewWindow(e)) {
      return;
    }
    e.preventDefault();

    if (!widget.state.swapdDropDownVisible) {
      this.sendWidgetAction("toggleSwapdDropdown");
    }
  },
};

createWidget(
  "swapd-dropdown",
  jQuery.extend(
    {
      tagName: "li.header-dropdown-toggle.swapd-dropdown",

      buildId() {
        return "swapd-dropdown";
      },

      html(attrs) {
        return h(
          "a.icon",
          {
            attributes: {
              "aria-haspopup": true,
              "aria-expanded": widget.state.swapdDropDownVisible
            },
          },
          iconNode("shopping-cart")
        );
      },
    },
    dropdown
  )
);

createWidget("swapd-dropdown-panel", {
  tagName: "div.swapd-dropdown-panel",

  html() {
    return this.attach("menu-panel", {
      contents: () => {
        return this.panelContents();
      },
      // maxWidth: this.site.mobileView ? null : 200
    });
  },

  panelContents() {
    let group1 = [];

    if (this.currentUser.can_view_tickets) {
      group1.push(this._createLink("/u/checkout/messages", "checkout_tickets", "shopping-cart"));
    } else {
      group1.push(this._createLink("/my/messages/tickets", "my_tickets", "ticket-alt"));
    }

    group1.push(this._createLink("/start", "start_checkout", "handshake"));
    group1.push(this._createLink(null, "start_topic", "plus-circle", "createTopic"));
    group1.push(this._createLink("/create-auction", "launch_auction", "gavel"));
    group1.push(this._createLink("/fees", "fee_calculator", "calculator"));

    group1 = h("ul.widget-links", group1);

    let group2 = [];
    group2.push(this._createLink("/my/invited/earnings", "swapd_rewards", "dollar-sign"));
    group2.push(this._createLink("/my/activity/report", "stats", "chart-line"));

    group2 = h("ul.widget-links", group2);

    const result = [group1, h("hr"), group2];

    if (!Ember.isBlank(settings.custom_links)) {
      result.push(h("hr"));

      result.push(new RawHtml({html: `<ul class="widget-links">${settings.custom_links}</ul>`}));
    }

    return result;
  },

  _createLink(href, i18nKey, icon, action) {
    return h("li", this.attach("link", {href, icon, action, label: themePrefix(i18nKey)}));
  },

  clickOutsideMobile(e) {
    const $centeredElement = $(document.elementFromPoint(e.clientX, e.clientY));
    if (
      $centeredElement.parents(".panel").length &&
      !$centeredElement.hasClass("header-cloak")
    ) {
      this.sendWidgetAction("toggleSwapdDropdown");
    } else {
      const $window = $(window);
      const windowWidth = $window.width();
      const $panel = $(".menu-panel");
      $panel.addClass("animate");
      const panelOffsetDirection = this.site.mobileView ? "left" : "right";
      $panel.css(panelOffsetDirection, -windowWidth);
      const $headerCloak = $(".header-cloak");
      $headerCloak.addClass("animate");
      $headerCloak.css("opacity", 0);
      Ember.run.later(() => this.sendWidgetAction("toggleSwapdDropdown"), 200);
    }
  },

  clickOutside(e) {
    if (this.site.mobileView) {
      this.clickOutsideMobile(e);
    } else {
      this.sendWidgetAction("toggleSwapdDropdown");
    }
  },

  createTopic() {
    let $createTopicButton = $("#create-topic");
    if ($createTopicButton.length) {
      $createTopicButton.click();
      return;
    }

    Discourse.__container__.lookup("controller:composer").open({
      action: Composer.CREATE_TOPIC,
      draftKey: Composer.NEW_TOPIC_KEY,
    });
  }
});

export default apiInitializer("0.11.1", api => {
  api.reopenWidget("header", {
    toggleSwapdDropdown() {
      this.state.swapdDropDownVisible = !this.state.swapdDropDownVisible;
      this.toggleBodyScrolling(this.state.swapdDropDownVisible);
    },

    closeAll() {
      this.state.swapdDropDownVisible = false;

      this._super(...arguments);
    },

    domClean() {
      const { state } = this;

      if (state.searchVisible || state.hamburgerVisible || state.userVisible || state.swapdDropDownVisible) {
        this.closeAll();
      }
    },

    html() {
      widget = this;

      return this._super(...arguments);
    }
  });

  if (api.getCurrentUser()) {
    api.addToHeaderIcons("swapd-dropdown");

    api.addHeaderPanel("swapd-dropdown-panel", "swapdDropDownVisible", function() {

    });
  }
});
