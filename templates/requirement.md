# Requirement: {{ name }}

## References
{% if references %}
{% for reference in references -%}
- {{ reference }}
  {% endfor %}
  {% else %}
  The references have to be specified as a list of file names
  {% endif %}
## Description

Please describe your assumption here!
