export interface SearchProps {
    datasource: string;
    searchConfiguration: any,
    datasourceConfiguration: any;
    customDatasourceHandler?: Function
};

export interface SearchState {
    isOpen: boolean;
    value: string;
    filters: Array<any>
};

export interface ResultsProps {
  data: Array<any>;
  mapping: any;
  closeHandler: Function;
  clickHandler: Function;
  topAnchor: number;
}

export interface FiltersProps {
    filters: Array<any>;
    setFilters: Function;
    openFilters?: Function;
}